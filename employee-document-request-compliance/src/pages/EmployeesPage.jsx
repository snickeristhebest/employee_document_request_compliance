import CreateEmployeeForm from "../components/employees/CreateEmployeeForm";
import EmployeesList from "../components/employees/EmployeesList";

export default function EmployeesPage({ onViewDocuments }) {
  return (
    <div style={{ padding: "2rem" }}>
      <CreateEmployeeForm />
      <EmployeesList onViewDocuments={onViewDocuments} />
    </div>
  );
}