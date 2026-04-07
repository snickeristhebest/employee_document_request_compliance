import { useState } from "react";
import { createEmployeeAccount } from "../../services/adminUserService";

export default function CreateEmployeeForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [clinic, setClinic] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setMessage("First name, last name, email, and password are required.");
      return;
    }

    if (password.trim().length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);

      await createEmployeeAccount({
        firstName,
        lastName,
        email,
        clinic,
        password,
        role: "employee",
      });

      setMessage("Employee account created successfully.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setClinic("");
      setPassword("");
    } catch (error) {
      console.error("Create employee account error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);

      setMessage(
        error.message || error.details || "Failed to create employee account."
      );
    } finally {
      setIsLoading(false);
    }
  }

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
        
        <input
          type="password"
          placeholder="Temporary password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Employee Account"}
        </button>
      </form>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}