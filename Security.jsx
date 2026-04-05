import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";

function Security() {
  const navigate = useNavigate();
  const { profile, updateProfileDetails, triggerSosAlert } = useAppData();
  const { showToast } = useToast();
  const [pulseOn, setPulseOn] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulseOn((current) => !current);
    }, 900);

    return () => window.clearInterval(timer);
  }, []);

  const activeContacts = useMemo(
    () => (profile.emergencyContacts || []).filter((contact) => contact.active),
    [profile.emergencyContacts]
  );

  async function handleEditContact(index) {
    const current = profile.emergencyContacts?.[index] || {
      id: String(index + 1),
      name: "Add Contact",
      phone: "",
      active: false,
    };

    const name = window.prompt("Emergency contact name", current.active ? current.name : "");
    if (!name) return;

    const phone = window.prompt("Emergency contact phone", current.phone || "");
    if (!phone) return;

    const nextContacts = [...(profile.emergencyContacts || [])];
    nextContacts[index] = {
      id: current.id || String(index + 1),
      name,
      phone,
      active: true,
    };

    setSavingId(nextContacts[index].id);

    try {
      await updateProfileDetails({
        emergencyContacts: nextContacts,
        sosContact: phone,
      });
      showToast({
        title: "Emergency contact saved",
        message: `${name} is now in your safety list.`,
        tone: "success",
      });
    } finally {
      setSavingId(null);
    }
  }

  async function handleSos() {
    await triggerSosAlert();
    showToast({
      title: "SOS ready",
      message: `Alert prepared for ${activeContacts.length || 1} emergency contact(s).`,
      tone: "success",
    });
  }

  return (
    <div className="page-grid">
      <section className="security-page">
        <div className="security-header">
          <button type="button" className="security-back-button" onClick={() => navigate(-1)}>
            Back
          </button>
          <div>
            <p className="eyebrow">Security</p>
            <h2>Safety Center</h2>
          </div>
          <div className="security-header-spacer" />
        </div>

        <section className="security-sos-section">
          <button
            type="button"
            className={`security-sos-button ${pulseOn ? "security-sos-pulse" : ""}`}
            onClick={handleSos}
          >
            SOS
          </button>
          <p>Tap to alert your emergency contacts with your active Roamio trip context.</p>
        </section>

        <section className="security-map-card">
          <div className="security-card-head">
            <div>
              <p className="eyebrow">Live location tracking</p>
              <strong>Safety map</strong>
            </div>
            <span className="security-live-badge">Live</span>
          </div>
          <div className="security-map-placeholder">
            <span>{profile.city || profile.hometown || "Mumbai"}</span>
            <small>Google Maps style live tracking can connect here later.</small>
          </div>
        </section>

        <section className="security-contacts-section">
          <div className="security-card-head">
            <div>
              <p className="eyebrow">Emergency contacts</p>
              <strong>Trusted reach list</strong>
            </div>
            <span className="security-count-badge">{activeContacts.length}/5</span>
          </div>

          <div className="security-contact-list">
            {(profile.emergencyContacts || []).map((contact, index) => (
              <button
                type="button"
                key={contact.id || index}
                className="security-contact-slot"
                onClick={() => handleEditContact(index)}
              >
                <div className={`security-contact-icon ${contact.active ? "security-contact-icon-active" : ""}`}>
                  {contact.active ? "OK" : "Add"}
                </div>
                <div className="security-contact-copy">
                  <strong className={contact.active ? "" : "security-contact-muted"}>{contact.name}</strong>
                  {contact.active && <span>{contact.phone}</span>}
                </div>
                <span className="security-contact-action">
                  {savingId === contact.id ? "..." : contact.active ? "Saved" : "Pick"}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

export default Security;
