export default function Navbar({ currentPage, onNavigate }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem 2rem",
        borderBottom: "1px solid #333",
        marginBottom: "2rem",
        backgroundColor: "#000",
      }}
    >
      <button
        onClick={() => onNavigate("employees")}
        style={navButtonStyle(currentPage === "employees")}
      >
        Employees
      </button>

      <button
        onClick={() => onNavigate("createRequest")}
        style={navButtonStyle(currentPage === "createRequest")}
      >
        Create Request
      </button>

      <button
        onClick={() => onNavigate("viewRequests")}
        style={navButtonStyle(currentPage === "viewRequests")}
      >
        View Requests
      </button>
      <button
        onClick={() => onNavigate("inactiveEmployees")}
        style={navButtonStyle(currentPage === "inactiveEmployees")}
      >
        Inactive Employees
      </button>
      <button
        onClick={() => onNavigate("myRequests")}
        style={navButtonStyle(currentPage === "myRequests")}
      >
        My Requests
    </button>
    </nav>
  );
}

function navButtonStyle(active) {
  return {
    padding: "0.6rem 1rem",
    border: "1px solid #555",
    backgroundColor: active ? "#444" : "transparent",
    color: "#fff",
    cursor: "pointer",
    borderRadius: "6px",
  };
}