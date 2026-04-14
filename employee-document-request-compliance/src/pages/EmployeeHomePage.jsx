import { useState } from "react";
import TopBar from "../components/layout/TopBar";
import MyRequestsList from "../components/employees/MyRequestsList";
import SubmitRequestPage from "./SubmitRequestPage";
import ChangePasswordPage from "./ChangePasswordPage";
import { useAuth } from "../context/AuthContext";

export default function EmployeeHomePage() {
  const { currentUser, userProfile } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (showChangePassword) {
    return (
      <div>
        <TopBar />
        <ChangePasswordPage onBack={() => setShowChangePassword(false)} />
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div>
        <TopBar />
        <SubmitRequestPage
          request={selectedRequest}
          onBack={() => setSelectedRequest(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <TopBar />

      <div style={{ padding: "2rem" }}>
        <h1>Employee Portal</h1>

        {userProfile?.mustChangePassword && (
          <div style={warningBoxStyle}>
            <h3 style={{ marginTop: 0 }}>Password change required</h3>
            <p style={{ marginBottom: "0.75rem" }}>
              You are still using your temporary password. Please change it as
              soon as possible.
            </p>
            <button onClick={() => setShowChangePassword(true)}>
              Change Password
            </button>
          </div>
        )}

        <p>
          <strong>Logged in as:</strong> {currentUser?.email}
        </p>

        <p>
          <strong>Employee ID:</strong> {userProfile?.employeeId}
        </p>

        {!userProfile?.mustChangePassword && (
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={() => setShowChangePassword(true)}>
              Change Password
            </button>
          </div>
        )}

        <MyRequestsList onSubmitRequest={setSelectedRequest} />
      </div>
    </div>
  );
}

const warningBoxStyle = {
  backgroundColor: "#fff3cd",
  color: "#856404",
  border: "1px solid #ffe69c",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1.5rem",
};