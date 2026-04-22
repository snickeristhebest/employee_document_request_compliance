import { useState } from "react";
import MyRequestsList from "../components/employees/MyRequestsList";
import SubmitRequestPage from "./SubmitRequestPage";
import { useAuth } from "../context/AuthContext";

export default function AdminPersonalRequestsPage() {
  const { currentUser, userProfile } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);

  if (selectedRequest) {
    return (
      <SubmitRequestPage
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
      />
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>My Requests</h1>

      <p>
        <strong>Logged in as:</strong> {currentUser?.email}
      </p>

      <p>
        <strong>Employee ID:</strong> {userProfile?.employeeId}
      </p>

      <MyRequestsList onSubmitRequest={setSelectedRequest} />
    </div>
  );
}