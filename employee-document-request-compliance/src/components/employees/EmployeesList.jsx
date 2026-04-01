import { useEffect, useState } from "react";
import {
  subscribeToEmployees,
  deleteEmployee,
} from "../../services/employeeService";

export default function EmployeesList({ onViewDocuments }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToEmployees(
      (data) => {
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading employees:", err);
        setError("Failed to load employees.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (employee) => {
    const firstConfirm = window.confirm(
      `Delete employee ${employee.firstName} ${employee.lastName}?`
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "This action is irreversible. Are you absolutely sure?"
    );

    if (!secondConfirm) return;

    try {
      await deleteEmployee(employee.id);
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Failed to delete employee.");
    }
  };

  if (loading) return <p>Loading employees...</p>;
  if (error) return <p>{error}</p>;
  if (employees.length === 0) return <p>No employees found.</p>;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Employees</h2>

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
            <th style={thStyle}>Active</th>
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
              <td style={tdStyle}>{employee.isActive ? "Yes" : "No"}</td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button onClick={() => onViewDocuments(employee)}>
                    View Documents
                  </button>
                  <button onClick={() => handleDelete(employee)}>Delete</button>
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