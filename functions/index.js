const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const auth = getAuth();

const sgMail = require("@sendgrid/mail");

exports.createEmployeeAccount = onCall(
    {region: "us-central1"},
    async (request) => {
      const caller = request.auth;

      if (!caller) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
      }

      const callerUid = caller.uid;
      const callerUserDoc = await db.collection("users").doc(callerUid).get();

      if (!callerUserDoc.exists) {
        throw new HttpsError("permission-denied", "No user profile found.");
      }

      const callerData = callerUserDoc.data();

      if (callerData.role !== "admin" || callerData.isActive === false) {
        throw new HttpsError(
            "permission-denied",
            "Only active admins can create accounts.",
        );
      }

      const data = request.data || {};
      const firstName = data.firstName;
      const lastName = data.lastName;
      const email = data.email;
      const clinic = data.clinic || "";
      const password = data.password;
      const role = data.role || "employee";

      if (
        !firstName || !firstName.trim() ||
        !lastName || !lastName.trim() ||
        !email || !email.trim() ||
        !password || !password.trim()
      ) {
        throw new HttpsError(
            "invalid-argument",
            "firstName, lastName, email, and password are required.",
        );
      }

      if (!["employee", "admin"].includes(role)) {
        throw new HttpsError(
            "invalid-argument",
            "role must be either 'employee' or 'admin'.",
        );
      }

      if (password.trim().length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Password must be at least 6 characters.",
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedClinic = clinic.trim().toLowerCase();
      const employeeId = normalizedEmail;

      try {
        const userRecord = await auth.createUser({
          email: normalizedEmail,
          password: password.trim(),
          displayName: `${firstName.trim()} ${lastName.trim()}`,
          disabled: false,
        });

        await db.collection("users").doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: normalizedEmail,
          role: role,
          employeeId: employeeId,
          isActive: true,
          mustChangePassword: true,
          temporaryPasswordCreatedAt: FieldValue.serverTimestamp(),
          passwordChangedAt: null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: callerUid,
        });

        await db.collection("employees").doc(employeeId).set(
            {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: normalizedEmail,
              clinic: normalizedClinic,
              isActive: true,
              role: role,
              authUid: userRecord.uid,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            {merge: true},
        );

        return {
          success: true,
          uid: userRecord.uid,
          employeeId: employeeId,
          email: normalizedEmail,
          role: role,
        };
      } catch (error) {
        console.error("createEmployeeAccount error:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
          error: error,
        });

        if (error.code === "auth/email-already-exists") {
          throw new HttpsError(
              "already-exists",
              "That email already has an auth account.",
          );
        }

        throw new HttpsError(
            "internal",
            error.message || "Failed to create employee account.",
        );
      }
    },
);

exports.sendScheduledReminders = onSchedule(
    {
      region: "us-central1",
      schedule: "0 8 * * *",
      timeZone: "America/Chicago",
    },
    async () => {
      const snapshot = await db
          .collection("requests")
          .where("isActive", "==", true)
          .get();

      const today = getTodayDateString();

      let processed = 0;
      let sent = 0;
      let skipped = 0;

      for (const doc of snapshot.docs) {
        processed += 1;

        const request = {
          id: doc.id,
          ...doc.data(),
        };

        const dueReminders = buildDueReminderCandidates(request, today);
        const expirationReminders = buildExpirationReminderCandidates(
            request,
            today,
        );

        const candidates = [...dueReminders, ...expirationReminders];

        if (candidates.length === 0) {
          skipped += 1;
          continue;
        }

        for (const candidate of candidates) {
          const claimed = await claimReminderSend(request, candidate);

          if (!claimed) {
            continue;
          }

          const result = await sendReminderEmail(request, candidate);

          await finalizeReminderHistory(request, candidate, result);

          if (result.status === "sent") {
            sent += 1;
          }
        }
      }

      console.log("sendScheduledReminders completed", {
        processed,
        sent,
        skipped,
        date: today,
      });
    },
);

function buildDueReminderCandidates(request, today) {
  if (!request.dueDate) {
    return [];
  }

  if (request.status !== "requested") {
    return [];
  }

  const config = request.reminderConfig || {};
  const offsets = Array.isArray(config.beforeDueDays) ?
    config.beforeDueDays :
    [];

  const daysUntilDue = diffDays(today, request.dueDate);

  return offsets
      .filter((offset) => Number.isInteger(offset))
      .filter((offset) => daysUntilDue === offset)
      .map((offset) => ({
        category: "before_due",
        offsetDays: offset,
        targetDate: request.dueDate,
      }));
}

function buildExpirationReminderCandidates(request, today) {
  if (!request.expirationRequired || !request.expirationDate) {
    return [];
  }

  if (request.status !== "approved") {
    return [];
  }

  const config = request.reminderConfig || {};
  const offsets = Array.isArray(config.beforeExpirationDays) ?
    config.beforeExpirationDays :
    [];

  const daysUntilExpiration = diffDays(today, request.expirationDate);

  return offsets
      .filter((offset) => Number.isInteger(offset))
      .filter((offset) => daysUntilExpiration === offset)
      .map((offset) => ({
        category: "before_expiration",
        offsetDays: offset,
        targetDate: request.expirationDate,
      }));
}

async function sendReminderEmail(request, candidate) {
  const subject = buildReminderSubject(request, candidate);
  const body = buildReminderBody(request, candidate);

  try {
    const apiKey = process.env.SENDGRID_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !apiKey.startsWith("SG.")) {
      throw new Error("SENDGRID_KEY is missing or invalid.");
    }

    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to: request.employeeEmail,
      from: fromEmail,
      subject,
      text: body,
    });

    return {status: "sent", subject};
  } catch (error) {
    console.error("Email send failed:", error);

    return {
      status: "failed",
      subject,
      errorMessage: error.message || "Unknown error",
    };
  }
}

async function finalizeReminderHistory(request, candidate, result) {
  const requestRef = db.collection("requests").doc(request.id);
  const reminderKey = `${candidate.category}_${candidate.offsetDays}`;
  const historyRef = requestRef.collection("reminderHistory").doc(reminderKey);

  await historyRef.update({
    subject: result.subject,
    status: result.status,
    errorMessage: result.errorMessage || "",
    sentAt: result.status === "sent" ? FieldValue.serverTimestamp() : null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (result.status === "sent") {
    await requestRef.update({
      lastReminderSentAt: FieldValue.serverTimestamp(),
      lastReminderType: reminderKey,
      reminderCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

function buildReminderSubject(request, candidate) {
  if (candidate.category === "before_due") {
    return `Reminder: "${request.title}" is due in ${candidate.offsetDays} day(s)`;
  }

  if (candidate.category === "before_expiration") {
    return `Reminder: "${request.title}" expires in ${candidate.offsetDays} day(s)`;
  }

  return `Reminder for "${request.title}"`;
}

const APP_URL = "https://employee-document-request-compliance.onrender.com";

function buildReminderBody(request, candidate) {
  const employeeName = request.employeeName || "Employee";
  const targetDate = candidate.targetDate || "N/A";
  const documentType = request.documentType || "document";
  const title = request.title || "Untitled request";

  if (candidate.category === "before_due") {
    return [
      `Hello ${employeeName},`,
      "",
      `This is a reminder that your ${documentType} request "${title}" is due in ${candidate.offsetDays} day(s).`,
      `Due date: ${targetDate}`,
      "",
      "Please log in and submit the required document before the due date.",
      "",
      `Portal Link: ${APP_URL}`,
    ].join("\n");
  }

  if (candidate.category === "before_expiration") {
    return [
      `Hello ${employeeName},`,
      "",
      `This is a reminder that your ${documentType} document "${title}" will expire in ${candidate.offsetDays} day(s).`,
      `Expiration date: ${targetDate}`,
      "",
      "Please submit an updated document before it expires.",
      "",
      `Portal Link: ${APP_URL}`,
    ].join("\n");
  }

  return [
    `Hello ${employeeName},`,
    "",
    `This is a reminder regarding "${title}".`,
    "",
    `Portal Link: ${APP_URL}`,
  ].join("\n");
}

function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function diffDays(fromDateStr, toDateStr) {
  const fromDate = new Date(`${fromDateStr}T00:00:00Z`);
  const toDate = new Date(`${toDateStr}T00:00:00Z`);
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((toDate - fromDate) / msPerDay);
}

async function claimReminderSend(request, candidate) {
  const requestRef = db.collection("requests").doc(request.id);
  const reminderKey = `${candidate.category}_${candidate.offsetDays}`;
  const historyRef = requestRef.collection("reminderHistory").doc(reminderKey);

  const now = Date.now();
  const staleAfterMs = 10 * 60 * 1000; // 10 minutes

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(historyRef);

    if (!snapshot.exists) {
      transaction.set(historyRef, {
        category: candidate.category,
        offsetDays: candidate.offsetDays,
        targetDate: candidate.targetDate,
        recipientEmail: request.employeeEmail || "",
        requestStatusAtSend: request.status || "",
        subject: buildReminderSubject(request, candidate),
        status: "pending",
        errorMessage: "",
        retryCount: 0,
        claimedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        sentAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return true;
    }

    const data = snapshot.data();

    if (data.status === "sent") {
      return false;
    }

    if (data.status === "failed") {
      transaction.update(historyRef, {
        status: "pending",
        errorMessage: "",
        retryCount: (data.retryCount || 0) + 1,
        claimedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return true;
    }

    if (data.status === "pending") {
      const claimedAtMs = data.claimedAt?.toMillis?.() || 0;
      const isStale = now - claimedAtMs > staleAfterMs;

      if (!isStale) {
        return false;
      }

      transaction.update(historyRef, {
        errorMessage: "Recovered stale pending reminder claim.",
        retryCount: (data.retryCount || 0) + 1,
        claimedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return true;
    }

    transaction.update(historyRef, {
      status: "pending",
      errorMessage: "",
      retryCount: (data.retryCount || 0) + 1,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return true;
  });
}

exports.runReminderScanNow = onCall(
    {region: "us-central1"},
    async (request) => {
      const caller = request.auth;

      if (!caller) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
      }

      const callerUid = caller.uid;
      const callerUserDoc = await db.collection("users").doc(callerUid).get();

      if (!callerUserDoc.exists) {
        throw new HttpsError("permission-denied", "No user profile found.");
      }

      const callerData = callerUserDoc.data();

      if (callerData.role !== "admin" || callerData.isActive === false) {
        throw new HttpsError(
            "permission-denied",
            "Only active admins can run reminder scans.",
        );
      }

      const snapshot = await db
          .collection("requests")
          .where("isActive", "==", true)
          .get();

      const today = getTodayDateString();

      let processed = 0;
      let sent = 0;
      let failed = 0;
      let skipped = 0;

      for (const docSnap of snapshot.docs) {
        processed += 1;

        const requestData = {
          id: docSnap.id,
          ...docSnap.data(),
        };

        const dueReminders = buildDueReminderCandidates(requestData, today);
        const expirationReminders = buildExpirationReminderCandidates(
            requestData,
            today,
        );

        const candidates = [...dueReminders, ...expirationReminders];

        if (candidates.length === 0) {
          skipped += 1;
          continue;
        }

        for (const candidate of candidates) {
          const claimed = await claimReminderSend(requestData, candidate);

          if (!claimed) {
            continue;
          }

          const result = await sendReminderEmail(requestData, candidate);

          await finalizeReminderHistory(requestData, candidate, result);

          if (result.status === "sent") {
            sent += 1;
          } else {
            failed += 1;
          }
        }
      }

      return {
        success: true,
        processed,
        sent,
        failed,
        skipped,
        date: today,
      };
    },
);
