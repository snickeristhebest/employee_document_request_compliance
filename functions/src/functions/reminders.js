const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {FieldValue} = require("firebase-admin/firestore");
const {db} = require("../firebaseAdmin");
const {APP_URL} = require("../config");
const {sendPlainTextEmail} = require("../services/emailService");

const sendScheduledReminders = onSchedule(
    {
      region: "us-central1",
      schedule: "0 8 * * *",
      timeZone: "America/Chicago",
    },
    async () => {
      const result = await runReminderScan();

      console.log("sendScheduledReminders completed", result);
    },
);

const runReminderScanNow = onCall(
    {region: "us-central1"},
    async (request) => {
      const caller = request.auth;

      if (!caller) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
      }

      await assertActiveAdmin(caller.uid);

      return await runReminderScan();
    },
);

async function assertActiveAdmin(uid) {
  const callerUserDoc = await db.collection("users").doc(uid).get();

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
}

async function runReminderScan() {
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
}

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
    await sendPlainTextEmail({
      to: request.employeeEmail,
      subject,
      body,
    });

    return {status: "sent", subject};
  } catch (error) {
    console.error("Reminder email send failed:", error);

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
  const title = request.title || "Untitled request";

  if (candidate.category === "before_due") {
    return `Reminder: "${title}" is due in ${candidate.offsetDays} day(s)`;
  }

  if (candidate.category === "before_expiration") {
    return `Reminder: "${title}" expires in ${candidate.offsetDays} day(s)`;
  }

  return `Reminder for "${title}"`;
}

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
  const staleAfterMs = 10 * 60 * 1000;

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

module.exports = {
  sendScheduledReminders,
  runReminderScanNow,
};
