import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const TOP_3 = [
  { id: "1", name: "Siddhant", xp: 12500, rank: 1 },
  { id: "2", name: "Krishang", xp: 11200, rank: 2 },
  { id: "3", name: "Shrika", xp: 9800, rank: 3 },
];

const ALL_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const QUESTS = [
  { id: "1", title: "Verify Travel ID", reward: "+1000 XP", icon: "check", done: false },
  { id: "2", title: "Start a 3-Day Streak", reward: "+500 XP", icon: "flame", done: true },
  { id: "3", title: "Blend with a Local", reward: "+200 XP", icon: "people", done: false },
];

const BATTLE_STATES = [
  { name: "Maharashtra", nomads: 65, explorers: 35 },
  { name: "Goa", nomads: 40, explorers: 60 },
  { name: "Rajasthan", nomads: 55, explorers: 45 },
  { name: "Kerala", nomads: 80, explorers: 20 },
];

function formatXp(value) {
  return value.toLocaleString();
}

function avatarLabel(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Arena() {
  const { profile } = useAppData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [battlingState, setBattlingState] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);

  const userXp = useMemo(() => profile.points * 20 + 50, [profile.points]);
  const myRank = useMemo(
    () => ({
      id: "me",
      name: profile.firstName || profile.name || "You",
      xp: userXp,
      rank: Math.max(12, 120 - Math.round(userXp / 80)),
    }),
    [profile.firstName, profile.name, userXp]
  );
  const achievementStorageKey = useMemo(
    () => `roamio-arena-achievement-${user?.uid || profile.email || profile.name || "guest"}`,
    [profile.email, profile.name, user?.uid]
  );
  const arenaStats = useMemo(
    () => [
      { label: "Current XP", value: formatXp(userXp) },
      { label: "India rank", value: `#${myRank.rank}` },
      { label: "States active", value: `${BATTLE_STATES.length}` },
    ],
    [myRank.rank, userXp]
  );

  useEffect(() => {
    if (window.localStorage.getItem(achievementStorageKey) === "seen") {
      return undefined;
    }

    const timer = window.setTimeout(() => setShowAchievement(true), 1200);
    return () => window.clearTimeout(timer);
  }, [achievementStorageKey]);

  function dismissAchievement() {
    window.localStorage.setItem(achievementStorageKey, "seen");
    setShowAchievement(false);
  }

  function handleQuestClick(quest) {
    showToast({
      title: quest.done ? "Quest already complete" : "Quest tracked",
      message: quest.done ? `${quest.title} is already in your XP bank.` : `${quest.reward} is now on your radar.`,
      tone: quest.done ? "neutral" : "success",
    });
  }

  function handleBattleDeploy(stateName) {
    setBattlingState(stateName);
  }

  function handleReinforce() {
    if (!battlingState) return;
    showToast({
      title: "XP deployed",
      message: `${userXp} XP pushed into ${battlingState}.`,
      tone: "success",
    });
    setBattlingState(null);
  }

  return (
    <div className="page-grid">
      <section className="arena-page">
        <div className="arena-header">
          <div>
            <p className="eyebrow">Arena</p>
            <h2>Travel Arena</h2>
            <p className="arena-subtitle">Dominate the map.</p>
          </div>
          <div className="arena-summary-strip">
            {arenaStats.map((item) => (
              <div key={item.label} className="arena-summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="arena-layout">
          <div className="arena-main-column">
            <section className="arena-leaderboard-shell">
              <div className="arena-podium">
                <div className="arena-podium-card arena-podium-second">
                  <div className="arena-avatar">{avatarLabel(TOP_3[1].name)}</div>
                  <strong>2</strong>
                  <span>{TOP_3[1].name}</span>
                </div>
                <div className="arena-podium-card arena-podium-first">
                  <div className="arena-avatar">{avatarLabel(TOP_3[0].name)}</div>
                  <p className="arena-trophy">Trophy</p>
                  <strong>1</strong>
                  <span>{TOP_3[0].name}</span>
                </div>
                <div className="arena-podium-card arena-podium-third">
                  <div className="arena-avatar">{avatarLabel(TOP_3[2].name)}</div>
                  <strong>3</strong>
                  <span>{TOP_3[2].name}</span>
                </div>
              </div>

              <div className="arena-standing-card">
                <span className="arena-standing-rank">#{myRank.rank}</span>
                <div className="arena-avatar arena-avatar-small">{avatarLabel(myRank.name)}</div>
                <div className="arena-standing-copy">
                  <strong>{myRank.name}</strong>
                  <span>{formatXp(myRank.xp)} XP</span>
                </div>
                <span className="arena-trend">up</span>
              </div>
            </section>

            <section className="arena-section">
              <div className="arena-section-head">
                <p className="eyebrow">State takeover</p>
                <button type="button" className="ghost-button" onClick={() => setShowFullMap(true)}>
                  View 28 states
                </button>
              </div>
              <div className="arena-battle-row">
                {BATTLE_STATES.map((state) => (
                  <article key={state.name} className="arena-battle-card">
                    <div className="arena-state-topline">
                      <h3>{state.name}</h3>
                      <span>{state.nomads}%</span>
                    </div>
                    <div className="arena-control-bar">
                      <div className="arena-tribe-fill arena-tribe-nomads" style={{ width: `${state.nomads}%` }} />
                      <div
                        className="arena-tribe-fill arena-tribe-explorers"
                        style={{ width: `${state.explorers}%` }}
                      />
                    </div>
                    <div className="arena-battle-legend">
                      <span>Nomads</span>
                      <span>Explorers</span>
                    </div>
                    <button type="button" className="arena-battle-button" onClick={() => handleBattleDeploy(state.name)}>
                      Deploy XP
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="arena-section">
              <div className="arena-section-head">
                <p className="eyebrow">India control board</p>
              </div>
              <div className="arena-state-preview-grid">
                {ALL_STATES.slice(0, 8).map((state, index) => (
                  <button
                    key={state}
                    type="button"
                    className="arena-state-card"
                    onClick={() => handleBattleDeploy(state)}
                  >
                    <strong>{state}</strong>
                    <div className="arena-mini-progress">
                      <div style={{ width: `${48 + (index % 5) * 10}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="arena-side-column">
            <section className="arena-section">
              <article className="arena-rules-card">
                <div className="arena-section-head">
                  <p className="eyebrow">Battle rules</p>
                  <span className="arena-help-dot">?</span>
                </div>
                <div className="arena-rule-row">
                  <span className="arena-rule-icon">bolt</span>
                  <p>Deploy your {formatXp(userXp)} XP to claim territory.</p>
                </div>
                <div className="arena-rule-row">
                  <span className="arena-rule-icon">shield</span>
                  <p>Reinforce states to defend your tribe.</p>
                </div>
              </article>
            </section>

            <section className="arena-section">
              <p className="eyebrow">Daily missions</p>
              <div className="arena-quest-list">
                {QUESTS.map((quest) => (
                  <article key={quest.id} className="arena-quest-card">
                    <div className="arena-quest-icon">{quest.icon}</div>
                    <div className="arena-quest-copy">
                      <strong>{quest.title}</strong>
                      <span>{quest.reward}</span>
                    </div>
                    {quest.done ? (
                      <span className="arena-quest-done">done</span>
                    ) : (
                      <button type="button" className="arena-go-button" onClick={() => handleQuestClick(quest)}>
                        Go
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      {showAchievement && (
        <div className="arena-overlay" onClick={dismissAchievement}>
          <div className="arena-achievement-card" onClick={(event) => event.stopPropagation()}>
            <div className="arena-achievement-badge">Trophy</div>
            <p className="eyebrow">Achievement unlocked</p>
            <h3>State Vanguard</h3>
            <button type="button" onClick={dismissAchievement}>
              Collect XP
            </button>
          </div>
        </div>
      )}

      {battlingState && (
        <div className="arena-overlay" onClick={() => setBattlingState(null)}>
          <div className="arena-battle-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{battlingState} Frontline</h3>
            <p>You are deploying your {formatXp(userXp)} XP to secure this state for the Nomads tribe.</p>
            <button type="button" className="arena-flash-core">
              Bolt
            </button>
            <button type="button" className="secondary-button" onClick={handleReinforce}>
              Reinforce state
            </button>
          </div>
        </div>
      )}

      {showFullMap && (
        <div className="arena-overlay" onClick={() => setShowFullMap(false)}>
          <div className="arena-map-modal" onClick={(event) => event.stopPropagation()}>
            <div className="arena-section-head">
              <h3>India: 28 states</h3>
              <button type="button" className="ghost-button" onClick={() => setShowFullMap(false)}>
                Close
              </button>
            </div>
            <div className="arena-state-grid">
              {ALL_STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  className="arena-state-card"
                  onClick={() => {
                    setBattlingState(state);
                    setShowFullMap(false);
                  }}
                >
                  <strong>{state}</strong>
                  <div className="arena-mini-progress">
                    <div />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Arena;
