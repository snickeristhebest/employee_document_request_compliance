import { useAuth } from "../context/AuthContext";

export default function EmployeeHomePage() {
  const { currentUser, userProfile } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Employee Portal</h1>
      <p>Logged in as: {currentUser?.email}</p>
      <p>Role: {userProfile?.role}</p>
      <p>This is where "My Requests" will go next.</p>
    </div>
  );
}