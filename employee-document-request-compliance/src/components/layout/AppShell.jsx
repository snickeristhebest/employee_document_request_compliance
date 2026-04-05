import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "./Navbar";
import TopBar from "./TopBar";

import EmployeesPage from "../../pages/EmployeesPage";
import RequestsPage from "../../pages/RequestsPage";
import ViewRequestsPage from "../../pages/ViewRequestsPage";
import EmployeeDocumentsPage from "../../pages/EmployeeDocumentsPage";
import LoginPage from "../../pages/LoginPage";

export default function AppShell() {
  const { currentUser, authLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleViewDocuments = (employee) => {
    setSelectedEmployee(employee);
    setCurrentPage("employeeDocuments");
  };

  const handleBackToEmployees = () => {
    setSelectedEmployee(null);
    setCurrentPage("employees");
  };

  if (authLoading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div>
      <TopBar />

      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      {currentPage === "employees" && (
        <EmployeesPage onViewDocuments={handleViewDocuments} />
      )}

      {currentPage === "createRequest" && <RequestsPage />}
      {currentPage === "viewRequests" && <ViewRequestsPage />}

      {currentPage === "employeeDocuments" && selectedEmployee && (
        <EmployeeDocumentsPage
          employee={selectedEmployee}
          onBack={handleBackToEmployees}
        />
      )}
    </div>
  );
}