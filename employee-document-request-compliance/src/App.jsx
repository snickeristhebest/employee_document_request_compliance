import { useState } from "react";
import Navbar from "./components/layout/Navbar";
import EmployeesPage from "./pages/EmployeesPage";
import RequestsPage from "./pages/RequestsPage";
import ViewRequestsPage from "./pages/ViewRequestsPage";
import EmployeeDocumentsPage from "./pages/EmployeeDocumentsPage";

export default function App() {
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

  return (
    <div>
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