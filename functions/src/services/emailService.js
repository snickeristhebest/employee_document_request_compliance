// functions/src/services/emailService.js

const sgMail = require("@sendgrid/mail");
const {APP_URL} = require("../config");

function setupSendGrid() {
  const apiKey = process.env.SENDGRID_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !apiKey.startsWith("SG.")) {
    throw new Error("SENDGRID_KEY is missing or invalid.");
  }

  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL is missing.");
  }

  sgMail.setApiKey(apiKey);

  return {fromEmail};
}

async function sendNewAccountEmail({
  to,
  firstName,
  email,
  temporaryPassword,
  role,
}) {
  const {fromEmail} = setupSendGrid();
  const accountType = role === "admin" ? "admin" : "employee";

  const body = [
    `Hello ${firstName},`,
    "",
    `Your ${accountType} account has been created for the employee credential portal.`,
    "",
    `Login email: ${email}`,
    `Temporary password: ${temporaryPassword}`,
    "",
    `Portal Link: ${APP_URL}`,
    "",
    "Please log in and change your password after signing in.",
  ].join("\n");

  await sgMail.send({
    to,
    from: fromEmail,
    subject: "Your employee credential portal account",
    text: body,
  });
}

async function sendPlainTextEmail({
  to,
  subject,
  body,
}) {
  const {fromEmail} = setupSendGrid();

  await sgMail.send({
    to,
    from: fromEmail,
    subject,
    text: body,
  });
}

module.exports = {
  sendNewAccountEmail,
  sendPlainTextEmail,
};
