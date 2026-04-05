import { useState } from "react";
import Navbar from "./Navbar";
import TopBar from "./TopBar";
import EmployeesPage from "../../pages/EmployeesPage";
import RequestsPage from "../../pages/RequestsPage";
import ViewRequestsPage from "../../pages/ViewRequestsPage";
import EmployeeDocumentsPage from "../../pages/EmployeeDocumentsPage";

export default function AdminShell() {
  const [currentPage, setCurrentPage] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  function handleViewDocuments(employee) {
    setSelectedEmployee(employee);
    setCurrentPage("employeeDocuments");
  }

  function handleBackToEmployees() {
    setSelectedEmployee(null);
    setCurrentPage("employees");
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