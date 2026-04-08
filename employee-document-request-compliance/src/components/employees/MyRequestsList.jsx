import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { subscribeToEmployeeRequests } from "../../services/requestService";

export default function MyRequestsList({ onSubmitRequest }) {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userProfile?.employeeId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToEmployeeRequests(
      userProfile.employeeId,
      (data) => {
        setRequests(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading employee requests:", err);
        setError("Failed to load your requests.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  if (loading) {
    return <p>Loading your requests...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!userProfile?.employeeId) {
    return <p>No employee profile is linked to this account.</p>;
  }

  if (requests.length === 0) {
    return <p>No requests found.</p>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>My Requests</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Document Type</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Instructions</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Due Date</th>
            <th style={thStyle}>Expiration Required</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td style={tdStyle}>{request.documentType}</td>
              <td style={tdStyle}>{request.title}</td>
              <td style={tdStyle}>{request.description || "-"}</td>
              <td style={tdStyle}>
                <span style={getStatusStyle(request.status)}>
                  {request.status}
                </span>
              </td>
              <td style={tdStyle}>{request.dueDate || "-"}</td>
              <td style={tdStyle}>
                {request.expirationRequired ? "Yes" : "No"}
              </td>
              <td style={tdStyle}>
                {(request.status === "requested" ||
                  request.status === "rejected") && (
                  <button
                    onClick={() => onSubmitRequest(request)}
                    style={{
                      padding: "0.45rem 0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    {request.status === "rejected" ? "Resubmit" : "Submit"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

const thStyle = {
  border: "1px solid #ccc",
  padding: "0.75rem",
  textAlign: "left",
  backgroundColor: "#f5f5f5",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "0.75rem",
  verticalAlign: "top",
};