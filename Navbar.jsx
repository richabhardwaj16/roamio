import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";

function Navbar({ isMobile }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, profile } = useAppData();
  const firstName = profile.name?.split(" ")[0] || "Traveler";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-context">
          <strong>Roamio</strong>
          <span>{firstName}</span>
        </div>
      </div>

      <div className="navbar-actions">
        <div className="notice-chip">{isMobile ? `${notifications.length}` : `${notifications.length} alerts`}</div>
        <div className="user-chip">
          <strong>{profile.level}</strong>
          <span>{isMobile ? firstName : user?.email}</span>
        </div>
        <button className="ghost-button" onClick={handleLogout}>
          {isMobile ? "Exit" : "Sign out"}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
