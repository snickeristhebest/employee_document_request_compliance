import { useEffect, useState } from "react";
import {
  subscribeToInactiveEmployees,
  reactivateEmployee,
  permanentlyDeleteEmployee,
} from "../../services/employeeService";

export default function InactiveEmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToInactiveEmployees(
      (data) => {
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading inactive employees:", err);
        setError("Failed to load inactive employees.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleReactivate(employee) {
    try {
      await reactivateEmployee(employee.id);
    } catch (err) {
      console.error("Reactivate employee error:", err);
      alert("Failed to reactivate employee.");
    }
  }

  async function handlePermanentDelete(employee) {
    const firstConfirm = window.confirm(
      `Permanently delete ${employee.firstName} ${employee.lastName}?`
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "This action is irreversible. Are you absolutely sure?"
    );

    if (!secondConfirm) return;

    try {
      await permanentlyDeleteEmployee(employee.id);
    } catch (err) {
      console.error("Permanent delete employee error:", err);
      alert("Failed to permanently delete employee.");
    }
  }

  if (loading) return <p style={{ padding: "2rem" }}>Loading inactive employees...</p>;
  if (error) return <p style={{ padding: "2rem" }}>{error}</p>;
  if (employees.length === 0) return <p style={{ padding: "2rem" }}>No inactive employees found.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inactive Employees</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>First Name</th>
            <th style={thStyle}>Last Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Clinic</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td style={tdStyle}>{employee.firstName}</td>
              <td style={tdStyle}>{employee.lastName}</td>
              <td style={tdStyle}>{employee.email}</td>
              <td style={tdStyle}>{employee.clinic || "-"}</td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleReactivate(employee)}>
                    Reactivate
                  </button>
                  <button onClick={() => handlePermanentDelete(employee)}>
                    Delete Permanently
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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