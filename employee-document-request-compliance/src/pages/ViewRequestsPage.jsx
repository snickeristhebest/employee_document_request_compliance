import RequestsList from "../components/requests/RequestsList";
import ReminderTestButton from "../components/requests/ReminderTestButton";

export default function ViewRequestsPage({ onViewRequest }) {
  return (
    <div style={{ padding: "2rem" }}>
      <ReminderTestButton />
      <RequestsList onViewRequest={onViewRequest} />
    </div>
  );
}