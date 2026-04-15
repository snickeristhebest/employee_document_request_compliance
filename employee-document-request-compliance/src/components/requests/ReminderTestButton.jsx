import { useState } from "react";
import { runReminderScanNow } from "../../services/reminderService";

export default function ReminderTestButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    setMessage("");

    try {
      const result = await runReminderScanNow();
      setMessage(
        `Done. Processed: ${result.processed}, Sent: ${result.sent}, Skipped: ${result.skipped}`
      );
    } catch (error) {
      console.error("Error:", error);
      setMessage(error.message || "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={handleRun} disabled={loading}>
        {loading ? "Running..." : "Run Reminder Scan Now"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}