import EmployeeDocuments from "../components/employees/EmployeeDocuments";

export default function EmployeeDocumentsPage({ employee, onBack }) {
  return <EmployeeDocuments employee={employee} onBack={onBack} />;
}