import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";
import AIPlanner from "../components/AIPlanner";

function Blends() {
  const navigate = useNavigate();
  const { trips, createBlend, buddies, profile, loading } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: "",
    destination: profile.destination,
    status: "Planning",
    budget: "500 USD",
    days: 4,
  });
  const [blendMode, setBlendMode] = useState("group");
  const recommendedMembers = buddies.slice(0, blendMode === "duo" ? 1 : 3);
  const blendSignals = [
    `Primary destination: ${profile.destination}`,
    `Budget preference: ${profile.budget}`,
    `Travel style: ${profile.travelStyle}`,
    `Interest tags: ${(profile.interests || []).join(", ")}`,
    `Blend mode: ${blendMode === "duo" ? "Duo recommendation" : "Small group recommendation"}`,
  ];
  const aiBlendPrompt = [
    `${form.days}-day blend trip to ${form.destination || profile.destination}`,
    `budget ${form.budget || profile.budget}`,
    `travel style ${profile.travelStyle}`,
    `mode ${blendMode}`,
    `group vibe ${(profile.interests || []).join(", ") || "flexible travel"}`,
    `possible members ${recommendedMembers.map((buddy) => buddy.name).join(", ") || "none yet"}`,
  ].join(", ");

  async function handleCreateBlend(event) {
    event.preventDefault();
    const nextBlend = await createBlend(
      {
        ...form,
        title:
          form.title.trim() ||
          `${form.destination || profile.destination} ${blendMode === "duo" ? "duo" : "group"} blend`,
      },
      blendMode
    );
    setForm((current) => ({ ...current, title: "" }));
    showToast({
      title: "Blend created",
      message: nextBlend
        ? "Your blend now has recommended members and a dedicated chat thread."
        : "Your group trip plan has been added to active blends.",
      tone: "success",
    });
    if (nextBlend?.id) {
      navigate("/app/chat", { state: { threadId: nextBlend.id } });
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Blends</p>
          <h2>Create group trips around destination fit, shared pace, and budget alignment.</h2>
          <p>
            Turn buddy matches into shared plans with trip length, destination focus, and simple
            travel coordination.
          </p>
          <div className="tag-row top-summary-tags">
            <span className="tag-pill">Default destination: {profile.destination}</span>
            <span className="tag-pill">Recommended budget: {profile.budget}</span>
            <span className="tag-pill">Travel style: {profile.travelStyle}</span>
          </div>
        </div>
        <div className="hero-glass-card">
          <p className="eyebrow">Blend signals</p>
          <div className="mini-list">
            {blendSignals.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="two-column-grid">
        <form className="panel blend-form-panel" onSubmit={handleCreateBlend}>
          <p className="eyebrow">Create blend</p>
          <h3>Ground trip planner</h3>
          <div className="blend-mode-row">
            <button
              type="button"
              className={`blend-mode-button ${blendMode === "duo" ? "blend-mode-button-active" : ""}`}
              onClick={() => setBlendMode("duo")}
            >
              Duo
            </button>
            <button
              type="button"
              className={`blend-mode-button ${blendMode === "group" ? "blend-mode-button-active" : ""}`}
              onClick={() => setBlendMode("group")}
            >
              Group
            </button>
          </div>
          <div className="form-grid">
            <input
              placeholder="Blend title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <input
              placeholder="Destination"
              value={form.destination}
              onChange={(event) =>
                setForm((current) => ({ ...current, destination: event.target.value }))
              }
            />
            <input
              placeholder="Budget"
              value={form.budget}
              onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="Days"
              value={form.days}
              onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))}
            />
          </div>
          <div className="blend-member-preview">
            <p className="eyebrow">AI recommended members</p>
            {recommendedMembers.length === 0 && (
              <div className="panel empty-state">No matches are available yet, so this blend will start solo.</div>
            )}
            {recommendedMembers.map((buddy) => (
              <div key={buddy.id} className="list-card">
                <div>
                  <strong>{buddy.name}</strong>
                  <p>
                    {buddy.destination} / {buddy.budget}
                  </p>
                  <small>{buddy.travelStyle}</small>
                </div>
                <span className="match-pill">{buddy.matchScore}% match</span>
              </div>
            ))}
          </div>
          <div className="panel-actions">
            <button type="submit">Create blend and open chat</button>
          </div>
        </form>

        <article className="panel">
          <p className="eyebrow">Suggested members</p>
          <h3>Best-fit travel buddies</h3>
          <div className="stack-list compact-stack">
            {loading && <div className="list-card">Loading blend suggestions...</div>}
            {!loading && buddies.length === 0 && (
              <div className="panel empty-state">No public travel profiles yet for blend suggestions.</div>
            )}
            {recommendedMembers.map((buddy) => (
              <div key={buddy.id} className="list-card">
                <div>
                  <strong>{buddy.name}</strong>
                  <p>
                    {buddy.destination} / {buddy.budget}
                  </p>
                  <small>{buddy.travelStyle}</small>
                </div>
                <span className="match-pill">{buddy.matchScore}% match</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <AIPlanner
        title="Blend AI planner"
        defaultPrompt={aiBlendPrompt}
      />

      <section className="panel">
        <p className="eyebrow">Active blends</p>
        <div className="stats-grid blend-grid">
          {trips.length === 0 && <div className="panel empty-state">No blends yet. Create your first group trip plan.</div>}
          {trips.map((trip) => (
            <article key={trip.id} className="blend-tile">
              <strong>{trip.title}</strong>
              <span className="blend-destination">{trip.destination}</span>
              <p>Ground trip planner ready for budget, shared itinerary, and member coordination.</p>
              <small>
                {(trip.members || []).length > 0
                  ? `Members: ${(trip.members || []).map((member) => member.name).join(", ")}`
                  : "Members: waiting for matches"}
              </small>
              <small>
                {trip.days} days / {trip.budget}
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Blends;
