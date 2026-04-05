import { NavLink } from "react-router-dom";
import logoImage from "../assets/logo.jpeg";

const links = [
  { to: "/app", label: "Home", icon: "01" },
  { to: "/app/arena", label: "Arena", icon: "02" },
  { to: "/app/explore", label: "Explore", icon: "03" },
  { to: "/app/friends", label: "Friends", icon: "04" },
  { to: "/app/blends", label: "Blends", icon: "05" },
  { to: "/app/chat", label: "Chat", icon: "06" },
  { to: "/app/profile", label: "Profile", icon: "07" },
  { to: "/app/security", label: "Security", icon: "08" },
  { to: "/app/emergency-contacts", label: "Emergency", icon: "09" },
  { to: "/app/settings", label: "Settings", icon: "10" },
];

function Sidebar({ isOpen, onToggle, onClose, isMobile }) {
  return (
    <aside
      className={`sidebar ${isOpen ? "" : "sidebar-collapsed"} ${isMobile ? "sidebar-mobile" : ""} ${
        isMobile && isOpen ? "sidebar-mobile-open" : ""
      }`}
    >
      <div className="brand-block">
        <div className="brand-mark">
          <img src={logoImage} alt="Roamio logo" className="brand-image" />
        </div>
        <div className={`brand-copy ${isOpen ? "" : "brand-copy-hidden"}`}>
          <h1>Roamio</h1>
          <p>Your Trip, Your Vibe</p>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? "<<" : ">>"}
        </button>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/app"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            <span>{link.icon}</span>
            {isOpen && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`sidebar-footer ${isOpen ? "" : "sidebar-footer-hidden"}`}>
        <p>Travel Safe</p>
        <small>ROAMIO is a Trip Planner, map, matching, memories, reviews, and chating platform</small>
      </div>

      {isMobile && isOpen && (
        <button className="mobile-sidebar-close" onClick={onClose}>
          Close menu
        </button>
      )}
    </aside>
  );
}

export default Sidebar;
