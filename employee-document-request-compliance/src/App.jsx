import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import EmployeeHomePage from "./pages/EmployeeHomePage";
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

  if (userProfile.role === "admin") {
    return <AdminShell />;
  }

  if (userProfile.role === "employee") {
    return (
      <div>
        <EmployeeHomePage />
      </div>
    );
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