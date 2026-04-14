import { useState } from "react";
import { createEmployeeAccount } from "../../services/adminUserService";

export default function CreateEmployeeForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [clinic, setClinic] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !role.trim()
    ) {
      setMessage("First name, last name, email, password, and role are required.");
      return;
    }

    if (password.trim().length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);

      await createEmployeeAccount({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        clinic: clinic.trim(),
        password: password.trim(),
        role,
      });

      setMessage(
        `${role === "admin" ? "Admin" : "Employee"} account created successfully.`
      );
      setFirstName("");
      setLastName("");
      setEmail("");
      setClinic("");
      setPassword("");
      setRole("employee");
    } catch (error) {
      console.error("Create employee account error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);

      setMessage(
        error.message || error.details || "Failed to create account."
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
          autoComplete="given-name"
        />

        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="text"
          placeholder="Clinic"
          value={clinic}
          onChange={(e) => setClinic(e.target.value)}
          autoComplete="organization"
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="password"
          placeholder="Temporary password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : `Create ${role === "admin" ? "Admin" : "Employee"} Account`}
        </button>
      </form>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}