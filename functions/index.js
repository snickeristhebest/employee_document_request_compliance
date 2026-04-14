const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const auth = getAuth();

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
        !firstName ||
      !firstName.trim() ||
      !lastName ||
      !lastName.trim() ||
      !email ||
      !email.trim() ||
      !password ||
      !password.trim()
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
