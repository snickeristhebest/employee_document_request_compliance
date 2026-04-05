import { useAuth } from "../../context/AuthContext";

export default function TopBar() {
  const { currentUser, logout } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 2rem",
        backgroundColor: "#111",
        color: "#fff",
      }}
    >
      <div>Logged in as: {currentUser?.email}</div>

      <button
        onClick={logout}
        style={{
          padding: "0.5rem 0.9rem",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}