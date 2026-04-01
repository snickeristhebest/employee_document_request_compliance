import { useEffect, useState } from "react";
import { subscribeToEmployees } from "../../services/employeeService";
import { createRequest } from "../../services/requestService";

export default function CreateRequestForm() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expirationRequired, setExpirationRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToEmployees(
      (data) => {
        setEmployees(data);
        setLoadingEmployees(false);
      },
      (err) => {
        console.error("Error loading employees:", err);
        setMessage("Failed to load employees.");
        setLoadingEmployees(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedEmployeeId || !documentType.trim() || !title.trim() || !dueDate) {
      setMessage("Employee, document type, title, and due date are required.");
      return;
    }

    const selectedEmployee = employees.find(
      (employee) => employee.id === selectedEmployeeId
    );

    if (!selectedEmployee) {
      setMessage("Selected employee was not found.");
      return;
    }

    try {
      await createRequest({
        employeeId: selectedEmployee.id,
        employeeEmail: selectedEmployee.email,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        documentType,
        title,
        description,
        dueDate,
        expirationRequired,
      });

      setMessage("Request created successfully.");
      setSelectedEmployeeId("");
      setDocumentType("");
      setTitle("");
      setDescription("");
      setDueDate("");
      setExpirationRequired(false);
    } catch (error) {
      console.error("Error creating request:", error);
      setMessage("Failed to create request.");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>Create Request</h1>

      {loadingEmployees ? (
        <p>Loading employees...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} — {employee.email}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Document type (e.g. TB Test)"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          />

          <input
            type="text"
            placeholder="Request title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Instructions / description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <label>
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ display: "block", marginTop: "0.5rem" }}
            />
          </label>

          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={expirationRequired}
              onChange={(e) => setExpirationRequired(e.target.checked)}
            />
            Expiration date required
          </label>

          <button type="submit">Create Request</button>
        </form>
      )}

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}