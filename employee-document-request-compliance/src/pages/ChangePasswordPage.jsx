import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { markPasswordChanged } from "../services/userService";

export default function ChangePasswordPage({ onBack }) {
  const { currentUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!currentUser?.email) {
      setIsError(true);
      setMessage("No authenticated user was found.");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setIsError(true);
      setMessage("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setIsError(true);
      setMessage("New password must be different from your current password.");
      return;
    }

    try {
      setIsLoading(true);

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      await markPasswordChanged(currentUser.uid);

      setMessage("Password changed successfully.");
      setIsError(false);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);

      let errorMessage = "Failed to change password.";

      if (error.code === "auth/invalid-credential") {
        errorMessage = "Your current password is incorrect.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Your current password is incorrect.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please wait a bit and try again.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Your new password is too weak.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "500px" }}>
      <button onClick={onBack} style={{ marginBottom: "1rem" }}>
        ← Back
      </button>

      <h1>Change Password</h1>

      <p>
        Update your password below. If you are using a temporary password, you
        should change it now.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />

        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Change Password"}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "1rem",
            color: isError ? "#b00020" : "#155724",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}