const {
  createEmployeeAccount,
} = require("./src/functions/createEmployeeAccount");

const {
  sendScheduledReminders,
  runReminderScanNow,
} = require("./src/functions/reminders");

exports.createEmployeeAccount = createEmployeeAccount;
exports.sendScheduledReminders = sendScheduledReminders;
exports.runReminderScanNow = runReminderScanNow;
