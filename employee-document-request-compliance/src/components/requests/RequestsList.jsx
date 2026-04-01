import { useEffect, useState } from "react";
import {
  subscribeToRequests,
  deleteRequest,
  updateRequestStatus,
} from "../../services/requestService";

const STATUS_OPTIONS = ["requested", "submitted", "approved", "rejected"];

export default function RequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToRequests(
      (data) => {
        setRequests(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading requests:", err);
        setError("Failed to load requests.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (request) => {
    const firstConfirm = window.confirm(
      `Delete request "${request.title}" for ${request.employeeName}?`
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "This action is irreversible. Are you absolutely sure?"
    );

    if (!secondConfirm) return;

    try {
      await deleteRequest(request.id);
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request.");
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setUpdatingId(requestId);
      await updateRequestStatus(requestId, newStatus);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update request status.");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p>{error}</p>;
  if (requests.length === 0) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Requests</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Employee</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Document Type</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Due Date</th>
            <th style={thStyle}>Expiration Required</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td style={tdStyle}>{request.employeeName}</td>
              <td style={tdStyle}>{request.employeeEmail}</td>
              <td style={tdStyle}>{request.documentType}</td>
              <td style={tdStyle}>{request.title}</td>
              <td style={tdStyle}>
                <select
                  value={request.status}
                  onChange={(e) =>
                    handleStatusChange(request.id, e.target.value)
                  }
                  disabled={updatingId === request.id}
                  style={getStatusSelectStyle(request.status)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td style={tdStyle}>{request.dueDate || "-"}</td>
              <td style={tdStyle}>
                {request.expirationRequired ? "Yes" : "No"}
              </td>
              <td style={tdStyle}>
                <button onClick={() => handleDelete(request)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusSelectStyle(status) {
  const baseStyle = {
    padding: "0.35rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.9rem",
    fontWeight: "600",
    textTransform: "capitalize",
    border: "1px solid #ccc",
    outline: "none",
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

const thStyle = {
  border: "1px solid #ccc",
  padding: "0.75rem",
  textAlign: "left",
  backgroundColor: "#f5f5f5",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "0.75rem",
};