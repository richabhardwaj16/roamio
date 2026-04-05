import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";

function buildXpSeed(value = "") {
  return Array.from(String(value)).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildDisplayXp(buddy) {
  const seed = buildXpSeed(`${buddy.id}-${buddy.name}`);
  const daily = 50 * ((seed % 5) + 1);
  const blend = 200 * ((seed % 3) + 1);
  const streak = seed % 2 === 0 ? 500 : 0;
  return daily + blend + streak;
}

function buddyImage(buddy) {
  if (buddy.photo) return buddy.photo;
  if (Array.isArray(buddy.photos)) {
    return buddy.photos.find(Boolean) || "";
  }
  return "";
}

function Friends() {
  const navigate = useNavigate();
  const { buddies, loading } = useAppData();
  const { showToast } = useToast();
  const [showXpInfo, setShowXpInfo] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");

  const enrichedBuddies = useMemo(
    () =>
      buddies.map((buddy) => ({
        ...buddy,
        displayXP: buildDisplayXp(buddy),
        image: buddyImage(buddy),
      })),
    [buddies]
  );

  const filteredBuddies = useMemo(() => {
    const query = searchUsername.trim().toLowerCase();
    if (!query) return enrichedBuddies;

    return enrichedBuddies.filter((buddy) => {
      const username = String(buddy.username || "").toLowerCase();
      const name = String(buddy.name || "").toLowerCase();
      return username.includes(query) || name.includes(query);
    });
  }, [enrichedBuddies, searchUsername]);

  const validMatches = useMemo(() => filteredBuddies.slice(0, 4), [filteredBuddies]);
  const pendingUsers = useMemo(() => filteredBuddies.slice(4, 10), [filteredBuddies]);

  function openChat(buddy) {
    showToast({
      title: "Blend opened",
      message: `${buddy.name} is ready to continue in chat.`,
      tone: "success",
    });
    navigate("/app/chat");
  }

  return (
    <div className="page-grid">
      <section className="friends-shell">
        <div className="friends-header">
          <div className="friends-title-row">
            <div>
              <p className="eyebrow">Friends</p>
              <h2>Blended Souls</h2>
            </div>
            <button
              type="button"
              className="friends-info-button"
              onClick={() => setShowXpInfo((current) => !current)}
            >
              {showXpInfo ? "Hide XP" : "XP info"}
            </button>
          </div>

          <button type="button" className="friends-notif-button">
            alerts
            <span className="friends-dot" />
          </button>
        </div>

        {showXpInfo && (
          <section className="friends-info-card">
            <div className="friends-info-head">
              <strong>Travel DNA Blueprint</strong>
            </div>
            <div className="friends-info-list">
              <div className="friends-info-row">
                <span>Daily app check-in</span>
                <strong>+50 XP</strong>
              </div>
              <div className="friends-info-row">
                <span>Successful blend match</span>
                <strong>+200 XP</strong>
              </div>
              <div className="friends-info-row">
                <span>3-day travel streak</span>
                <strong>+500 XP</strong>
              </div>
            </div>
            <small>Higher XP unlocks stronger badges and more visible match energy.</small>
          </section>
        )}

        <section className="friends-search-shell">
          <div className="friends-search-copy">
            <p className="eyebrow">Search</p>
            <strong>Find by username</strong>
          </div>
          <input
            type="text"
            className="friends-search-input"
            placeholder="Search username or name"
            value={searchUsername}
            onChange={(event) => setSearchUsername(event.target.value)}
          />
        </section>

        <section className="friends-pending-section">
          <p className="eyebrow">Pending blends ({pendingUsers.length})</p>
          {loading && <div className="panel empty-state">Loading travel matches...</div>}
          {!loading && pendingUsers.length === 0 && (
            <div className="panel empty-state">
              {searchUsername.trim()
                ? "No pending users matched that search."
                : "More pending blends will appear as new public profiles join."}
            </div>
          )}
          <div className="friends-pending-row">
            {pendingUsers.map((buddy) => (
              <div key={buddy.id} className="friends-pending-card">
                <div className="friends-pending-avatar-shell">
                  {buddy.image ? (
                    <img src={buddy.image} alt={buddy.name} className="friends-pending-avatar" />
                  ) : (
                    <div className="friends-avatar-fallback">{buddy.name.slice(0, 2).toUpperCase()}</div>
                  )}
                  <span className="friends-timer-badge">21h</span>
                </div>
                <span className="friends-pending-name">{buddy.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="friends-grid-section">
          <p className="eyebrow">Mutual matches ({validMatches.length})</p>
          {!loading && validMatches.length === 0 && (
            <div className="panel empty-state">
              {searchUsername.trim()
                ? "No users matched that username yet."
                : "No mutual matches yet. Ask another traveler to complete their profile."}
            </div>
          )}

          <div className="friends-match-grid">
            {validMatches.map((buddy) => (
              <article key={buddy.id} className="friends-match-card">
                {buddy.image ? (
                  <img src={buddy.image} alt={buddy.name} className="friends-match-image" />
                ) : (
                  <div className="friends-match-image friends-match-fallback">
                    {buddy.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="friends-match-overlay" />

                <div className="friends-vibe-tag">Fellow backpacker</div>

                <div className="friends-match-copy">
                  <h3>{buddy.name}</h3>
                  <p className="friends-username">
                    @{buddy.username || buddy.name?.toLowerCase()?.replace(/\s+/g, "")}
                  </p>
                  <div className="friends-xp-row">
                    <span>XP</span>
                    <small>{buddy.displayXP} XP - 3 day streak</small>
                  </div>
                </div>

                <button type="button" className="friends-chat-button" onClick={() => openChat(buddy)}>
                  Chat
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

export default Friends;
