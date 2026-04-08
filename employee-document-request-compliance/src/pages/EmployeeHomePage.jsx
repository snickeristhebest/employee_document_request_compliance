import { useState } from "react";
import TopBar from "../components/layout/TopBar";
import MyRequestsList from "../components/employees/MyRequestsList";
import SubmitRequestPage from "./SubmitRequestPage";
import { useAuth } from "../context/AuthContext";

export default function EmployeeHomePage() {
  const { currentUser, userProfile } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);

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

        <p>
          <strong>Logged in as:</strong> {currentUser?.email}
        </p>

        <p>
          <strong>Employee ID:</strong> {userProfile?.employeeId}
        </p>

        <MyRequestsList onSubmitRequest={setSelectedRequest} />
      </div>
    </div>
  );
}