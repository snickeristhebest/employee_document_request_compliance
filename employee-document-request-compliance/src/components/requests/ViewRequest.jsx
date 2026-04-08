import { useEffect, useState } from "react";
import {
  subscribeToRequestById,
  updateRequestStatus,
} from "../../services/requestService";

export default function ViewRequest({ requestId, onBack }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setError("No request selected.");
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = subscribeToRequestById(
      requestId,
      (data) => {
        setRequest(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading request:", err);
        setError("Failed to load request.");
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [requestId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      await updateRequestStatus(requestId, newStatus);
    } catch (err) {
      console.error("Error updating request status:", err);
      alert("Failed to update request status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <button onClick={onBack} style={{ marginBottom: "1rem" }}>
          ← Back
        </button>
        <p>Loading request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <button onClick={onBack} style={{ marginBottom: "1rem" }}>
          ← Back
        </button>
        <p>{error}</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: "2rem" }}>
        <button onClick={onBack} style={{ marginBottom: "1rem" }}>
          ← Back
        </button>
        <p>Request not found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <button onClick={onBack} style={{ marginBottom: "1rem" }}>
        ← Back
      </button>

      <h1>View Request</h1>

      <div style={cardStyle}>
        <p><strong>Employee:</strong> {request.employeeName || "-"}</p>
        <p><strong>Email:</strong> {request.employeeEmail || "-"}</p>
        <p><strong>Document Type:</strong> {request.documentType || "-"}</p>
        <p><strong>Title:</strong> {request.title || "-"}</p>
        <p><strong>Description:</strong> {request.description || "-"}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span style={getStatusStyle(request.status)}>
            {request.status || "requested"}
          </span>
        </p>
        <p><strong>Due Date:</strong> {request.dueDate || "-"}</p>
        <p>
          <strong>Expiration Required:</strong>{" "}
          {request.expirationRequired ? "Yes" : "No"}
        </p>
        <p><strong>Expiration Date:</strong> {request.expirationDate || "-"}</p>
        <p><strong>Submitted At:</strong> {formatTimestamp(request.submittedAt)}</p>
        <p><strong>Approved At:</strong> {formatTimestamp(request.approvedAt)}</p>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h2>Uploaded File</h2>

        {!request.fileUrl ? (
          <p>No file has been submitted yet.</p>
        ) : (
          <div style={cardStyle}>
            <p>
              <a href={request.fileUrl} target="_blank" rel="noreferrer">
                Open uploaded file
              </a>
            </p>

            {isPreviewableFile(request.fileUrl) && (
              <iframe
                src={request.fileUrl}
                title="Uploaded document preview"
                style={{
                  width: "100%",
                  height: "600px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                }}
              />
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
        <button onClick={() => handleStatusUpdate("approved")} disabled={updating}>
          Approve
        </button>
        <button onClick={() => handleStatusUpdate("rejected")} disabled={updating}>
          Reject
        </button>
        <button onClick={() => handleStatusUpdate("requested")} disabled={updating}>
          Reset to Requested
        </button>
      </div>
    </div>
  );
}

function isPreviewableFile(fileUrl) {
  if (!fileUrl) return false;
  const lower = fileUrl.toLowerCase();
  return (
    lower.includes(".pdf") ||
    lower.includes(".png") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".webp")
  );
}

function formatTimestamp(timestamp) {
  if (!timestamp?.toDate) return "-";
  return timestamp.toDate().toLocaleString();
}

function getStatusStyle(status) {
  const baseStyle = {
    display: "inline-block",
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.9rem",
    fontWeight: "600",
    textTransform: "capitalize",
  };

  switch (status) {
    case "approved":
      return {
        ...baseStyle,
        backgroundColor: "#d4edda",
        color: "#155724",
      };
    case "rejected":
      return {
        ...baseStyle,
        backgroundColor: "#f8d7da",
        color: "#721c24",
      };
    case "submitted":
      return {
        ...baseStyle,
        backgroundColor: "#fff3cd",
        color: "#856404",
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: "#e2e3e5",
        color: "#383d41",
      };
  }
}

const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "1rem",
  backgroundColor: "#fafafa",
};