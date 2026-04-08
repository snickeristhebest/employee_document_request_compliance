import RequestsList from "../components/requests/RequestsList";

export default function ViewRequestsPage({ onViewRequest }) {
  return <RequestsList onViewRequest={onViewRequest} />;
}