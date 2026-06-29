// functions/src/functions/createEmployeeAccount.js

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {FieldValue} = require("firebase-admin/firestore");
const {db, auth} = require("../firebaseAdmin");
const {generateTemporaryPassword} = require("../utils/passwordUtils");
const {sendNewAccountEmail} = require("../services/emailService");

const createEmployeeAccount = onCall(
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
      const temporaryPassword = generateTemporaryPassword();
      const role = data.role || "employee";

      if (
        !firstName || !firstName.trim() ||
        !lastName || !lastName.trim() ||
        !email || !email.trim()
      ) {
        throw new HttpsError(
            "invalid-argument",
            "firstName, lastName, and email are required.",
        );
      }

      if (!["employee", "admin"].includes(role)) {
        throw new HttpsError(
            "invalid-argument",
            "role must be either 'employee' or 'admin'.",
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedClinic = clinic.trim().toLowerCase();
      const employeeId = normalizedEmail;

      try {
        const userRecord = await auth.createUser({
          email: normalizedEmail,
          password: temporaryPassword,
          displayName: `${firstName.trim()} ${lastName.trim()}`,
          disabled: false,
        });

        await db.collection("users").doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: normalizedEmail,
          role,
          employeeId,
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
              role,
              authUid: userRecord.uid,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            {merge: true},
        );

        await sendNewAccountEmail({
          to: normalizedEmail,
          firstName: firstName.trim(),
          email: normalizedEmail,
          temporaryPassword,
          role,
        });

        return {
          success: true,
          uid: userRecord.uid,
          employeeId,
          email: normalizedEmail,
          role,
        };
      } catch (error) {
        console.error("createEmployeeAccount error:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
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

module.exports = {
  createEmployeeAccount,
};
