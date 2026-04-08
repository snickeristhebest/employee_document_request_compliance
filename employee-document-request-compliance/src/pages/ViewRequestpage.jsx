import ViewRequest from "../components/requests/ViewRequest";

export default function ViewRequestPage({ requestId, onBack }) {
  return <ViewRequest requestId={requestId} onBack={onBack} />;
}