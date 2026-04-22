import { useState } from "react";
import Navbar from "./Navbar";
import TopBar from "./TopBar";
import EmployeesPage from "../../pages/EmployeesPage";
import RequestsPage from "../../pages/RequestsPage";
import ViewRequestsPage from "../../pages/ViewRequestsPage";
import EmployeeDocumentsPage from "../../pages/EmployeeDocumentsPage";
import ViewRequestPage from "../../pages/ViewRequestpage";
import InactiveEmployeesPage from "../../pages/InactiveEmployeesPage";
import AdminPersonalRequestsPage from "../../pages/AdminPersonalRequestsPage";

export default function AdminShell() {
  const [currentPage, setCurrentPage] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [returnPage, setReturnPage] = useState("employees");

  function handleViewDocuments(employee) {
    setSelectedEmployee(employee);
    setCurrentPage("employeeDocuments");
  }

  function handleBackToEmployees() {
    setSelectedEmployee(null);
    setCurrentPage("employees");
  }

  function handleViewRequest(requestId, fromPage = "viewRequests") {
    setSelectedRequestId(requestId);
    setReturnPage(fromPage);
    setCurrentPage("viewRequest");
  }

  function handleBackFromViewRequest() {
    setSelectedRequestId(null);
    setCurrentPage(returnPage);
  }

  return (
    <div>
      <TopBar />
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      {currentPage === "employees" && (
        <EmployeesPage onViewDocuments={handleViewDocuments} />
      )}

      {currentPage === "createRequest" && <RequestsPage />}

      {currentPage === "viewRequests" && (
        <ViewRequestsPage
          onViewRequest={(requestId) => handleViewRequest(requestId, "viewRequests")}
        />
      )}

      {currentPage === "employeeDocuments" && selectedEmployee && (
        <EmployeeDocumentsPage
          employee={selectedEmployee}
          onBack={handleBackToEmployees}
          onViewRequest={(requestId) =>
            handleViewRequest(requestId, "employeeDocuments")
          }
        />
      )}

      {currentPage === "viewRequest" && selectedRequestId && (
        <ViewRequestPage
          requestId={selectedRequestId}
          onBack={handleBackFromViewRequest}
        />
      )}

      {currentPage === "inactiveEmployees" && <InactiveEmployeesPage />}
      {currentPage === "myRequests" && <AdminPersonalRequestsPage />}
    </div>
  );
}