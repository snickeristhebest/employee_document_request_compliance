import { useState } from "react";
import { createEmployee } from "../../services/employeeService";

export default function CreateEmployeeForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [clinic, setClinic] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setMessage("First name, last name, and email are required.");
      return;
    }

    try {
      await createEmployee({ firstName, lastName, email, clinic });
      setMessage("Employee created successfully.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setClinic("");
    } catch (error) {
      console.error("Error creating employee:", error);
      setMessage(error.message || "Failed to create employee.");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "500px" }}>
      <h1>Create Employee</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Clinic"
          value={clinic}
          onChange={(e) => setClinic(e.target.value)}
        />

        <button type="submit">Create Employee</button>
      </form>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}