import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import EmployeeHomePage from "./pages/EmployeeHomePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminShell from "./components/layout/AdminShell";

function AppContent() {
  const {
    currentUser,
    userProfile,
    authLoading,
    profileLoading,
    profileError,
    logout,
  } = useAuth();

  const [showChangePassword, setShowChangePassword] = useState(false);

  if (authLoading) {
    return <p style={{ padding: "2rem" }}>Loading authentication...</p>;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (profileLoading) {
    return <p style={{ padding: "2rem" }}>Loading user profile...</p>;
  }

  if (profileError) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Error</h1>
        <p>{profileError}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>No access</h1>
        <p>No matching Firestore user profile was found for this account.</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  if (userProfile.isActive === false) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Account inactive</h1>
        <p>Your account is inactive.</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  if (showChangePassword) {
    return (
      <ChangePasswordPage onBack={() => setShowChangePassword(false)} />
    );
  }

  if (userProfile.mustChangePassword) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px" }}>
        <h1>Password change required</h1>
        <p>
          You are still using a temporary password. Please change it before
          continuing.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button onClick={() => setShowChangePassword(true)}>
            Change Password
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

  if (userProfile.role === "admin") {
    return <AdminShell />;
  }

  if (userProfile.role === "employee") {
    return <EmployeeHomePage />;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Unauthorized</h1>
      <p>This account has an unknown role.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}