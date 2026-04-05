import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";
import { askAI, getAiHealth } from "../services/aiService";

const GRAPH_SIZE = 100;
const CENTER = GRAPH_SIZE / 2;
const RADIUS = GRAPH_SIZE / 2 - 10;

function fallbackPhotos() {
  return [
    "https://via.placeholder.com/900x1200/f0ede7/223042?text=Roamio",
    "https://via.placeholder.com/900x1200/e9f3f6/223042?text=Travel",
    "https://via.placeholder.com/900x1200/f8e9dd/223042?text=Memory",
  ];
}

function buildMedia(profile) {
  const photos = (profile.photos || []).filter(Boolean);
  const prompts = (profile.prompts || []).filter((item) => item.question);
  const usablePhotos = photos.length > 0 ? photos : fallbackPhotos();
  const media = [];

  usablePhotos.slice(0, 6).forEach((photo, index) => {
    media.push({ type: "image", source: photo, id: `image-${index}` });
    if (prompts[index]) {
      media.push({ type: "prompt", ...prompts[index], id: `prompt-${index}` });
    }
  });

  return media;
}

function polygonPoint(value, index) {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * RADIUS * value,
    y: CENTER + Math.sin(angle) * RADIUS * value,
  };
}

function notificationStamp(time, index) {
  if (time) return time;
  if (index === 0) return "Just now";
  if (index === 1) return "A moment ago";
  return "Recently";
}

function buildDna(profile) {
  return {
    vibe: profile.travelerDNA?.socialPreference ?? 0.5,
    budget: profile.travelerDNA?.budgetStyle ?? 0.5,
    spontaneity: 1 - (profile.travelerDNA?.planningStyle ?? 0.5),
    food:
      profile.interests?.includes("Foodie Traveler") || profile.interests?.includes("food") ? 0.9 : 0.6,
    adventure:
      profile.interests?.includes("Adventure Junkie") || profile.interests?.includes("adventure")
        ? 0.9
        : profile.travelerDNA?.energyLevel ?? 0.5,
  };
}

function getCompatibility(dna) {
  return Math.floor(((dna.vibe + dna.budget + dna.spontaneity + dna.food + dna.adventure) / 5) * 100);
}

function seededIndex(seedValue, length) {
  if (!length) return 0;
  const seed = String(seedValue || "roamio")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return seed % length;
}

function getAIInsight(dna, person) {
  const travelStyle = (person?.travelStyle || "balanced pace").toLowerCase();
  const destination = person?.destination || "the route";

  const templates = {
    Adventure: [
      `Expect detours—this trip leans adventurous, and ${destination} rewards that energy.`,
      `High-energy days ahead. Keep the plan loose and let the bold moments lead.`,
      `This route skews daring; build in buffer time for side quests and extra views.`,
    ],
    Budget: [
      `Smart spends unlock the best of ${destination}. Value-first choices keep the pace steady.`,
      `Clever budgeting fuels more stops. Think local transport and markets over pricey extras.`,
      `Cost-aware itinerary; save on stays so experiences can take center stage.`,
    ],
    Spontaneity: [
      `Loose plans, open mornings. Let the day shape itself and keep one anchor activity.`,
      `Minimal scripting works here. Leave space for serendipity and street finds.`,
      `This traveler thrives on improv; pencil plans, don’t ink them.`,
    ],
    Food: [
      `Food stays core to this route. Build days around markets, tastings, and slow meals.`,
      `Cafes and kitchens drive the map—reserve a headline meal and browse the rest.`,
      `Meals are milestones. Let restaurants set the rhythm and layer sights around them.`,
    ],
    Vibe: [
      `Social energy sets the tone. Pick stays with common areas and guided group slots.`,
      `The vibe is people-first; co-working cafés and meetups will keep momentum high.`,
      `Expect conversation-forward days. Shared tables and local tours beat solo wandering.`,
    ],
  };

  const traits = [
    {
      name: "Adventure",
      val: dna.adventure,
    },
    {
      name: "Budget",
      val: dna.budget,
    },
    {
      name: "Spontaneity",
      val: dna.spontaneity,
    },
    {
      name: "Food",
      val: dna.food,
    },
    {
      name: "Vibe",
      val: dna.vibe,
    },
  ];

  const sorted = traits.sort((a, b) => b.val - a.val);
  const primary = sorted[0];
  const runnerUp = sorted[1] || primary;
  const options = templates[primary.name] || templates.Vibe;
  const selected = options[seededIndex(`${person?.uid || person?.id || person?.name}-${runnerUp.name}`, options.length)];

  return selected
    .replace("{style}", travelStyle)
    .replace("{destination}", destination);
}

function describePersonality(dna = {}) {
  const traits = [];
  const social = dna.socialPreference ?? 0.5;
  const planning = dna.planningStyle ?? 0.5;
  const energy = dna.energyLevel ?? 0.5;

  if (social >= 0.6) {
    traits.push("social");
  } else if (social <= 0.4) {
    traits.push("chill");
  }

  if (planning >= 0.6) {
    traits.push("planner");
  } else if (planning <= 0.4) {
    traits.push("spontaneous");
  }

  if (energy >= 0.7) {
    traits.push("bold explorer");
  } else if (energy <= 0.3) {
    traits.push("calm");
  }

  return traits.length ? traits.join(", ") : "balanced";
}

function describeTraveler(traveler = {}, label) {
  const interests = (traveler.interests || []).join(", ") || "open to discovery";
  const tripDuration =
    traveler.tripDuration || traveler.duration || "Flexible (3-5 days)";
  const destination = traveler.destination || "flexible destinations";
  const budget = traveler.budget || "flexible budget";
  const travelStyle = traveler.travelStyle || "balanced travel style";
  const personality = describePersonality(traveler.travelerDNA);

  return `${label}: ${traveler.name || "Traveler"} | Interests: ${interests} | Budget: ${budget} | Travel style: ${travelStyle} | Preferred destination: ${destination} | Trip duration: ${tripDuration} | Personality: ${personality}`;
}

function buildBlendPrompt(host, buddies, mode) {
  const bestBlendType = mode === "duo" ? "Duo" : "Group";
  const templateLines = [
    "MATCH RESULT",
    `Best Blend Type: ${bestBlendType}`,
    "Matched Travelers:",
    "- Traveler A",
    "- Traveler B",
    "- Traveler C",
    "",
    "Why They Match:",
    "(short explanation)",
    "",
    "Suggested Destination:",
    "(place + reason)",
    "",
    "Mini Trip Plan:",
    "Day 1",
    "Day 2",
    "Day 3",
    "",
    "Travel Tips:",
    "- tip 1",
    "- tip 2",
    "- tip 3",
  ];

  const mappingLines = [
    "Traveler mapping:",
    `Traveler A = ${host.name || "You"}`,
    ...buddies.map((buddy, index) => {
      const label = String.fromCharCode(66 + index);
      return `Traveler ${label} = ${buddy.name || "Traveler"}`;
    }),
  ];

  const travelerData = [
    describeTraveler(host, "Traveler A (you)"),
    ...buddies.map((buddy, index) =>
      describeTraveler(buddy, `Traveler ${String.fromCharCode(66 + index)}`)
    ),
  ];

  const instructions = [
    "You are analyzing traveler profiles to choose the most compatible duo or small group.",
    "Always prioritize safety, budget compatibility, and shared interests.",
    "Keep responses friendly, practical, and travel-focused.",
    `Blend mode requested: ${bestBlendType}.`,
    "",
    ...templateLines,
    "",
    ...mappingLines,
    "",
    "Traveler data:",
    ...travelerData,
    "",
    `Blend mode for this request: ${bestBlendType}`,
    `Preferred destination signals: ${[
      host.destination,
      ...buddies.map((buddy) => buddy.destination),
    ]
      .filter(Boolean)
      .join(", ") || "open to many places"}`,
  ];

  return instructions.join("\n");
}

function Home() {
  const { profile, buddies: matchedBuddies = [], allProfiles, notifications, quiz, dismissNotification } =
    useAppData();
  const { showToast } = useToast();
  const [blendMode, setBlendMode] = useState("group");
  const [blendOverlayVisible, setBlendOverlayVisible] = useState(false);
  const [blendLoading, setBlendLoading] = useState(false);
  const [blendResult, setBlendResult] = useState("");
  const [blendError, setBlendError] = useState("");
  const [aiHealth, setAiHealth] = useState({
    loading: true,
    ok: false,
    message: "Checking AI",
    model: "",
  });
  const [zoomImage, setZoomImage] = useState(null);
  const [activeQuiz] = useState(() => quiz[Math.floor(Math.random() * quiz.length)] || quiz[0]);
  const [quizState, setQuizState] = useState({ open: false, result: "" });

  const graphAxes = useMemo(
    () =>
      [...Array(5)].map((_, index) => {
        const point = polygonPoint(1, index);
        return { id: `axis-${index}`, x: point.x, y: point.y };
      }),
    []
  );
  const focusedMatches = useMemo(() => {
    const limit = blendMode === "duo" ? 1 : 3;
    return matchedBuddies.slice(0, limit);
  }, [blendMode, matchedBuddies]);

  useEffect(() => {
    async function loadHealth() {
      const result = await getAiHealth();
      setAiHealth({ loading: false, ...result });
    }
    loadHealth();
  }, []);

  function answerQuiz(option) {
    const correct = option === activeQuiz.answer;
    setQuizState({
      open: true,
      result: correct ? "Correct. You unlocked 10 explorer points." : "Not quite. Try again later.",
    });
    showToast({
      title: correct ? "Quiz answered correctly" : "Quiz answer saved",
      message: correct ? "Explorer points added to your session mood." : "Try another place fact next.",
      tone: correct ? "success" : "neutral",
    });
  }

  async function handleBlend() {
    const selected =
      blendMode === "duo" ? matchedBuddies.slice(0, 1) : matchedBuddies.slice(0, 3);
    setBlendOverlayVisible(true);
    setBlendError("");
    setBlendResult("");
    if (selected.length === 0) {
      setBlendLoading(false);
      const message =
        "No compatible travelers yet. Update your profile or explore to unlock duo/group blends.";
      setBlendError(message);
      showToast({
        title: "Blend needs companions",
        message,
        tone: "neutral",
      });
      return;
    }

    setBlendLoading(true);
    try {
      const prompt = buildBlendPrompt(profile || {}, selected, blendMode);
      const result = await askAI(prompt, "blend-match");
      setBlendResult(result);
      setBlendError("");
      showToast({
        title: "Blend AI ready",
        message: "Your match summary is waiting in the blend overlay.",
        tone: "success",
      });
    } catch (error) {
      const errorMessage = String(error?.message || "Blend AI request failed. Please try again.");
      setBlendError(errorMessage);
      showToast({
        title: "Blend AI error",
        message: errorMessage,
        tone: "critical",
      });
    } finally {
      setBlendLoading(false);
    }
  }

  return (
    <div className="home-experience">
      <div className="home-sticky-header">
        <div className="home-sticky-shell">
          <div>
            <strong className="home-sticky-name">Community travel feed</strong>
          </div>
          <div className="home-sticky-loc">
            <span className="home-location-dot" />
            <span>{allProfiles.length} profiles visible</span>
          </div>
        </div>
      </div>

      <div className="home-scroll-shell">
        {allProfiles.map((person) => {
          const media = buildMedia(person);
          const dna = buildDna(person);
          const compatibility = getCompatibility(dna);
          const polygonPoints = [dna.vibe, dna.budget, dna.spontaneity, dna.food, dna.adventure]
            .map((value, index) => {
              const point = polygonPoint(value, index);
              return `${point.x},${point.y}`;
            })
            .join(" ");

          return (
            <section key={person.uid} className="home-user-section">
              <section className="home-id-card">
                <div>
                  <p className="eyebrow">Now Exploring</p>
                  <h2 className="home-name-text">
                    {person.name}
                    {person.age ? `, ${person.age}` : ""}
                  </h2>
                  <p className="panel-subcopy">{person.bio || "Travel profile ready for discovery."}</p>
                </div>
                <div className="home-id-right">
                  <span className="home-location-dot" />
                  <span>{person.hometown || person.city || "India"}</span>
                  <span className="status-note">{person.level || "Explorer"}</span>
                </div>
              </section>

              {media.map((item) =>
                item.type === "image" ? (
                  <button
                    type="button"
                    key={`${person.uid}-${item.id}`}
                    className="home-gallery-wrapper"
                    onClick={() => setZoomImage(item.source)}
                  >
                    <img src={item.source} alt={`${person.name} travel memory`} className="home-gallery-img" />
                  </button>
                ) : (
                  <section key={`${person.uid}-${item.id}`} className="home-prompt-card">
                    <div className="home-prompt-header">
                      <span className="home-bubble-dot" />
                      <span>{item.question}</span>
                    </div>
                    <p className="home-prompt-answer">{item.answer || "..."}</p>
                  </section>
                )
              )}

              <section className="home-intel-card">
                <div className="home-intel-left">
                  <p className="eyebrow">Travel snapshot</p>
                  <p className="home-intel-desc">{getAIInsight(dna, person)}</p>
                  <div className="home-score-box">
                    <strong>{compatibility}%</strong>
                    <span>FIT</span>
                  </div>
                  <div className="tag-row">
                    {(person.interests || []).slice(0, 4).map((interest) => (
                      <span key={`${person.uid}-${interest}`} className="tag-pill">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="home-intel-right">
                  <svg width={GRAPH_SIZE} height={GRAPH_SIZE} viewBox={`0 0 ${GRAPH_SIZE} ${GRAPH_SIZE}`}>
                    {graphAxes.map((axis) => (
                      <line
                        key={`${person.uid}-${axis.id}`}
                        x1={CENTER}
                        y1={CENTER}
                        x2={axis.x}
                        y2={axis.y}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                      />
                    ))}
                    <polygon
                      points={polygonPoints}
                      fill="rgba(20, 184, 166, 0.4)"
                      stroke="#14B8A6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </section>
            </section>
          );
        })}

        <section className="home-prompt-card">
          <div className="home-prompt-header">
            <span className="home-bubble-dot" />
            <span>{activeQuiz.question}</span>
          </div>
          <div className="home-quiz-options">
            {activeQuiz.options.map((option) => (
              <button
                type="button"
                key={option}
                className="secondary-button"
                onClick={() => answerQuiz(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {quizState.open && <div className="success-banner">{quizState.result}</div>}
        </section>

        {notifications.length > 0 && (
          <section className="home-prompt-card home-notification-panel">
            <div className="home-prompt-header home-notification-header">
              <div className="home-live-title">
                <span className="home-bubble-dot" />
                <span>Live notifications</span>
              </div>
              <span className="live-pill">{notifications.length} active</span>
            </div>
            <div className="stack-list compact-stack">
              {notifications.slice(0, 3).map((item, index) => (
                <div key={item.id} className="list-card home-notification-card">
                  <div className="home-notification-copy">
                    <span className="status-note">{notificationStamp(item.time, index)}</span>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={async () => {
                      await dismissNotification(item.id);
                      showToast({
                        title: "Notification cleared",
                        message: "The alert was removed from your travel feed.",
                        tone: "neutral",
                      });
                    }}
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="home-blend-toolbar">
        <div className="home-blend-mode-selector">
          <button
            type="button"
            className={`home-blend-mode-button ${blendMode === "duo" ? "home-blend-mode-button-active" : ""}`}
            onClick={() => setBlendMode("duo")}
          >
            Duo
          </button>
          <button
            type="button"
            className={`home-blend-mode-button ${blendMode === "group" ? "home-blend-mode-button-active" : ""}`}
            onClick={() => setBlendMode("group")}
          >
            Group
          </button>
        </div>
        <span className="home-blend-mode-hint">
          {blendMode === "duo"
            ? "Targeting one travel buddy for a focused duo."
            : "Designing a small group blend (3-5 people)."}
        </span>
        <span
          className={`home-blend-health ${aiHealth.loading ? "home-blend-health-checking" : aiHealth.ok ? "home-blend-health-ok" : "home-blend-health-bad"}`}
        >
          {aiHealth.loading
            ? "AI: checking..."
            : aiHealth.ok
            ? `AI ready ${aiHealth.model ? `(${aiHealth.model})` : ""}`
            : `AI offline: ${aiHealth.message || "unknown"}`}
        </span>
      </div>

      <div className="home-dock">
        <button type="button" className="home-dock-icon" onClick={() => setZoomImage(null)}>
          x
        </button>
        <button type="button" className="home-blend-button" onClick={handleBlend}>
          Blend DNA
        </button>
        <button
          type="button"
          className="home-dock-icon home-dock-like"
          onClick={() =>
            showToast({
              title: "Saved",
              message: "This profile mood has been saved to your session.",
              tone: "success",
            })
          }
        >
          like
        </button>
      </div>

      {zoomImage && (
        <div className="home-zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="home-zoom-shell">
            <img src={zoomImage} alt="Zoomed travel memory" className="home-zoom-image" />
            <p className="home-zoom-hint">Click anywhere to close</p>
          </div>
        </div>
      )}

      {blendOverlayVisible && (
        <div
          className="home-blend-overlay"
          onClick={() => {
            if (!blendLoading) {
              setBlendOverlayVisible(false);
            }
          }}
        >
          <div className="home-blend-card" onClick={(event) => event.stopPropagation()}>
            <div className="home-blend-card-header">
              <div>
                <p className="eyebrow">Blend AI match</p>
                <h3>Travelers in sync</h3>
                <p className="panel-subcopy">Matching interests, budgets, and safety insights.</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                disabled={blendLoading}
                onClick={() => setBlendOverlayVisible(false)}
              >
                Close
              </button>
            </div>

            <div className="blend-match-summary">
              <p className="eyebrow">Matched travelers</p>
              <ul>
                <li>
                  <strong>You</strong> • {profile?.destination || "Flexible"} •{" "}
                  {profile?.budget || "Balanced"} • {profile?.travelStyle || "Flexible"}
                </li>
                {focusedMatches.map((buddy) => (
                  <li key={buddy.uid || buddy.id || buddy.name}>
                    <strong>{buddy.name}</strong> • {buddy.destination || "Flexible"} •{" "}
                    {buddy.budget || "Flexible"} • {buddy.travelStyle || "Flexible"}
                  </li>
                ))}
              </ul>
            </div>

            {blendLoading ? (
              <div className="home-blend-loader">
                <div className="home-sync-icon">sync</div>
                <h3>Blending DNA...</h3>
                <p>Analyzing traveler data for the requested blend.</p>
              </div>
            ) : blendResult ? (
              <div className="blend-output-card">
                <pre className="blend-output">{blendResult}</pre>
              </div>
            ) : blendError ? (
              <p className="home-blend-error">{blendError}</p>
            ) : (
              <p className="home-blend-placeholder">Tap Blend DNA to generate the match summary.</p>
            )}

            <div className="blend-overlay-actions">
              <button type="button" onClick={handleBlend} disabled={blendLoading}>
                {blendLoading ? "Refreshing..." : "Refresh summary"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
