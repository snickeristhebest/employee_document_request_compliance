import EmployeeDocuments from "../components/employees/EmployeeDocuments";

export default function EmployeeDocumentsPage({
  employee,
  onBack,
  onViewRequest,
}) {
  return (
    <EmployeeDocuments
      employee={employee}
      onBack={onBack}
      onViewRequest={onViewRequest}
    />
  );
}