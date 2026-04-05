import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";
import { applyStateTheme } from "../theme/stateTheme";

function Settings({ theme, onThemeToggle }) {
  const { profile, updateProfileDetails, clearCommunityChat, notifications } = useAppData();
  const { showToast } = useToast();
  const [toggles, setToggles] = useState({
    liveMap: true,
    notifications: true,
    quizzes: true,
    publicProfile: false,
  });

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Settings</p>
          <h2>Control travel signals, privacy, safety defaults, and app behavior.</h2>
          <p>
            Adjust map behavior, notifications, quiz prompts, and community visibility in one place.
          </p>
        </div>
        <div className="hero-glass-card">
          <p className="eyebrow">Status</p>
          <strong>{notifications.length} active notifications</strong>
          <p>Your current SOS contact is {profile.sosContact}. Review this before live travel.</p>
        </div>
      </section>
      <section className="two-column-grid">
        <article className="panel">
          <p className="eyebrow">Settings</p>
          <h2>App controls</h2>
          <div className="toggle-list">
            <label className="toggle-row">
              <div>
                <strong>Appearance</strong>
                <p>Switch between light and dark mode.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={onThemeToggle}
              >
                {theme === "light" ? "Light mode" : "Dark mode"}
              </button>
            </label>
            <label className="toggle-row">
              <div>
                <strong>Default app theme</strong>
                <p>Apply the new Sunrise orange base palette instantly.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  localStorage.removeItem("roamio-last-state");
                  localStorage.removeItem("roamio-selected-state");
                  showToast({
                    title: "Default palette restored",
                    message: "Base theme set to Sunrise orange. Pick a destination to override.",
                    tone: "success",
                  });
                  // Re-apply default palette for current theme mode
                  const currentMode =
                    document.documentElement.getAttribute("data-theme") ||
                    localStorage.getItem("roamio-theme") ||
                    "light";
                  applyStateTheme("", currentMode);
                }}
              >
                Set default palette
              </button>
            </label>
            {Object.entries(toggles).map(([key, value]) => (
              <label key={key} className="toggle-row">
                <div>
                  <strong>{key}</strong>
                  <p>Toggle {key} for your Roamio experience.</p>
                </div>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => {
                    setToggles((current) => ({ ...current, [key]: !current[key] }));
                    showToast({
                      title: "Setting updated",
                      message: `${key} has been toggled.`,
                      tone: "neutral",
                    });
                  }}
                />
              </label>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Safety and notifications</p>
          <h3>Emergency contact and alerts</h3>
          <div className="info-grid">
            <div className="info-block">
              <span>Current SOS contact</span>
              <strong>{profile.sosContact}</strong>
            </div>
            <div className="info-block">
              <span>Active notifications</span>
              <strong>{notifications.length}</strong>
            </div>
          </div>
          <div className="mini-contact-list">
            {(profile.emergencyContacts || []).slice(0, 3).map((contact, index) => (
              <div key={contact.id || index} className="mini-contact-row">
                <div className="mini-contact-dot">{contact.name?.[0] || "?"}</div>
                <div>
                  <strong>{contact.name || "Add Contact"}</strong>
                  <p>{contact.phone || "No number saved"}</p>
                </div>
              </div>
            ))}
            {(profile.emergencyContacts || []).length === 0 && (
              <p className="mini-contact-empty">Add trusted contacts in Safety Center.</p>
            )}
          </div>
          <div className="panel-actions">
            <button
              className="secondary-button"
              onClick={async () => {
                await updateProfileDetails({ sosContact: "112 / trusted contact" });
                showToast({
                  title: "SOS contact updated",
                  message: "Your default safety contact has been refreshed.",
                  tone: "success",
                });
              }}
            >
              Set default SOS contact
            </button>
            <button
              className="ghost-button"
              onClick={async () => {
                await clearCommunityChat();
                showToast({
                  title: "Community chat cleared",
                  message: "The shared chat room was reset.",
                  tone: "neutral",
                });
              }}
            >
              Clear community chat
            </button>
            <Link className="secondary-link" to="/app/security">
              Open Safety Center
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Settings;
