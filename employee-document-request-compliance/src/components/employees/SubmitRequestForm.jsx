import { useState } from "react";
import { submitEmployeeRequest } from "../../services/requestService";
import { useAuth } from "../../context/AuthContext";

export default function SubmitRequestForm({ request, onBack }) {
  const { userProfile } = useAuth();
  const [file, setFile] = useState(null);
  const [expirationDate, setExpirationDate] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!file) {
      setMessage("Please choose a file.");
      return;
    }

    if (request.expirationRequired && !expirationDate) {
      setMessage("Expiration date is required for this request.");
      return;
    }

    try {
      setIsLoading(true);

      await submitEmployeeRequest({
        requestId: request.id,
        employeeId: userProfile.employeeId,
        file,
        expirationDate: request.expirationRequired ? expirationDate : null,
      });

      setMessage("Request submitted successfully.");
      setFile(null);
      setExpirationDate("");
    } catch (error) {
      console.error("Submit request error:", error);
      setMessage(error.message || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <button onClick={onBack} style={{ marginBottom: "1rem" }}>
        ← Back to My Requests
      </button>

      <h1>Submit Request</h1>

      <p>
        <strong>Document Type:</strong> {request.documentType}
      </p>
      <p>
        <strong>Title:</strong> {request.title}
      </p>
      <p>
        <strong>Instructions:</strong> {request.description || "-"}
      </p>
      <p>
        <strong>Due Date:</strong> {request.dueDate || "-"}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />

        {request.expirationRequired && (
          <div>
            <label>
              Expiration Date
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                style={{ display: "block", marginTop: "0.5rem" }}
              />
            </label>
          </div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}