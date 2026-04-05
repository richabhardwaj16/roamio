import { useEffect, useRef, useState } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";

const TOTAL_STEPS = 12;
const RELIGIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Punjabi",
  "Maharashtrian ",
  "Sindhi",
  "Gujrati",
  "Marwadi",
  "Jewish",
  "Atheist",
  "Spiritual",
  "Other",
  "Prefer not to say",
];
const RELATIONSHIP_GOALS = ["Travel Buddy", "Adventure Partner", "Group Trips", "Just Exploring"];
const TRAVEL_FREQUENCY = [
  "Once a year",
  "2-3 trips/year",
  "Every few months",
  "Monthly",
  "Always travelling",
];
const VIBES = [
  "Luxury Lover",
  "Budget Backpacker",
  "Culture Explorer",
  "Party Nomad",
  "Nature Seeker",
  "Digital Nomad",
  "Foodie Traveler",
  "Adventure Junkie",
  "Slow Traveler",
  "Spiritual Explorer",
];
const INDIAN_STATES = [
  "New to Travelling",
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

const PROMPT_OPTIONS = [
  { category: "Adventure", text: "My craziest travel story starts with..." },
  { category: "Adventure", text: "The most spontaneous trip I ever took was..." },
  { category: "Adventure", text: "One adventure I still can't believe happened..." },
  { category: "Foodie", text: "I'm the type of traveler who eats..." },
  { category: "Foodie", text: "The best food I've had while travelling was..." },
  { category: "Foodie", text: "Street food I will never forget..." },
  { category: "Vibe", text: "My ideal trip looks like..." },
  { category: "Vibe", text: "A perfect day while travelling includes..." },
  { category: "Vibe", text: "My travel vibe in three words..." },
  { category: "Red Flag", text: "My travel red flag is..." },
  { category: "Red Flag", text: "One thing I absolutely hate on trips..." },
  { category: "Red Flag", text: "The worst travel habit someone can have..." },
  { category: "Deep", text: "Travel changed my perspective on..." },
  { category: "Deep", text: "A place that changed my life..." },
  { category: "Deep", text: "Travel taught me that..." },
  { category: "Fun", text: "My funniest travel moment..." },
  { category: "Fun", text: "The weirdest thing I've seen while travelling..." },
  { category: "Fun", text: "If a trip goes wrong, I usually..." },
  { category: "Dream", text: "My dream destination is..." },
  { category: "Dream", text: "A place I must visit before I die..." },
  { category: "Dream", text: "My next dream trip would be..." },
];

function defaultPrompts() {
  return [
    { question: "My ideal trip looks like...", answer: "" },
    { question: "The one place I'll always return to...", answer: "" },
    { question: "My travel red flag is...", answer: "" },
  ];
}

function ensurePhotoSlots(photos) {
  if (Array.isArray(photos) && photos.length >= 6) {
    return photos.slice(0, 6);
  }

  const nextPhotos = Array(6).fill("");
  (Array.isArray(photos) ? photos : []).slice(0, 6).forEach((photo, index) => {
    nextPhotos[index] = photo || "";
  });
  return nextPhotos;
}

function ensurePromptSlots(prompts) {
  const defaults = defaultPrompts();

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return defaults;
  }

  return defaults.map((fallbackPrompt, index) => ({
    ...fallbackPrompt,
    ...(prompts[index] || {}),
  }));
}

function buildFormFromProfile(profile) {
  return {
    firstName: profile.firstName || profile.name?.split(" ")?.[0] || "",
    middleName: profile.middleName || "",
    lastName: profile.lastName || profile.name?.split(" ")?.slice(1).join(" ") || "",
    age: profile.age || "",
    gender: profile.gender || "",
    username: profile.username || profile.email?.split("@")?.[0] || "",
    password: "",
    religion: profile.religion || "",
    goal: profile.goal || "",
    frequency: profile.frequency || "",
    hometown: profile.hometown || profile.city || "",
    selectedVibes: profile.interests || [],
    statesVisited: profile.visitedStates || [],
    photos: ensurePhotoSlots(profile.photos),
    prompts: ensurePromptSlots(profile.prompts),
    budgetStyle: profile.travelerDNA?.budgetStyle ?? 0.5,
    energyLevel: profile.travelerDNA?.energyLevel ?? 0.5,
    planningStyle: profile.travelerDNA?.planningStyle ?? 0.5,
    socialPreference: profile.travelerDNA?.socialPreference ?? 0.5,
  };
}

function Profile() {
  const { profile, updateProfileDetails } = useAppData();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(null);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const fileInputsRef = useRef([]);
  const [form, setForm] = useState(() => buildFormFromProfile(profile));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setForm(buildFormFromProfile(profile));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [profile]);

  const completedPhotoCount = form.photos.filter(Boolean).length;
  const showSetup = isEditing || !profile.profileCompleted;

  function getVibeText(label, value) {
    const v = Math.round(value * 10) / 10;
    if (label === "Budget Style") {
      if (v <= 0.2) return "Penny Pincher";
      if (v <= 0.4) return "Budget Seeker";
      if (v <= 0.6) return "Balanced Spender";
      if (v <= 0.8) return "Splurger";
      return "Luxury Lover";
    }
    if (label === "Energy Level") {
      if (v <= 0.2) return "Chill & Relax";
      if (v <= 0.4) return "Sightseer";
      if (v <= 0.6) return "Active Voyager";
      if (v <= 0.8) return "Adventure Junkie";
      return "Wild Explorer";
    }
    if (label === "Planning Style") {
      if (v <= 0.2) return "Total Chaos";
      if (v <= 0.4) return "Spontaneous";
      if (v <= 0.6) return "Go with the flow";
      if (v <= 0.8) return "Semi-Structured";
      return "Master Planner";
    }
    if (v <= 0.2) return "Solo Soul";
    if (v <= 0.4) return "Small Circle";
    if (v <= 0.6) return "Balanced";
    if (v <= 0.8) return "Social Butterfly";
    return "Group Vibe";
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleMultiSelect(key, value) {
    setForm((current) => {
      const currentList = current[key];
      if (currentList.includes(value)) {
        return { ...current, [key]: currentList.filter((item) => item !== value) };
      }
      return { ...current, [key]: [...currentList, value] };
    });
  }

  function clearCurrentStep() {
    setError("");
    if (step === 1) {
      setForm((current) => ({
        ...current,
        firstName: "",
        middleName: "",
        lastName: "",
        age: "",
        gender: "",
      }));
    }
    if (step === 2) {
      setForm((current) => ({ ...current, username: "", password: "" }));
    }
    if (step === 3) updateForm("religion", "");
    if (step === 4) updateForm("goal", "");
    if (step === 5) updateForm("frequency", "");
    if (step === 6) updateForm("selectedVibes", []);
    if (step === 7) {
      setForm((current) => ({
        ...current,
        budgetStyle: 0.5,
        energyLevel: 0.5,
        planningStyle: 0.5,
        socialPreference: 0.5,
      }));
    }
    if (step === 8) updateForm("statesVisited", []);
    if (step === 9) updateForm("photos", Array(6).fill(""));
    if (step === 10) updateForm("hometown", "");
    if (step === 11) updateForm("prompts", defaultPrompts());
  }

  function validateStep() {
    setError("");
    if (step === 1 && (!form.firstName || !form.lastName || !form.age || !form.gender)) {
      setError("Complete identity fields.");
      return;
    }
    if (step === 2 && !form.username) {
      setError("Add a username.");
      return;
    }
    if (step === 3 && !form.religion) {
      setError("Select your religion.");
      return;
    }
    if (step === 4 && !form.goal) {
      setError("Select your intent.");
      return;
    }
    if (step === 5 && !form.frequency) {
      setError("Select travel frequency.");
      return;
    }
    if (step === 6 && form.selectedVibes.length === 0) {
      setError("Select at least one vibe.");
      return;
    }
    if (step === 8 && form.statesVisited.length === 0) {
      setError("Select a visited state.");
      return;
    }
    if (step === 9 && completedPhotoCount < 2) {
      setError("Upload at least 2 photos.");
      return;
    }
    if (step === 10 && !form.hometown) {
      setError("Add your hometown.");
      return;
    }

    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  function onPhotoUpload(index, file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => {
        const nextPhotos = [...current.photos];
        nextPhotos[index] = String(reader.result || "");
        return { ...current, photos: nextPhotos };
      });
    };
    reader.readAsDataURL(file);
  }

  function renderSlider(label, valueKey) {
    const value = form[valueKey];

    return (
      <div className="profile-slider-block">
        <div className="profile-slider-head">
          <strong>{label}</strong>
          <span>{getVibeText(label, value)}</span>
        </div>
        <div className="profile-slider-row">
          <button
            type="button"
            className="secondary-button profile-stepper-btn"
            onClick={() => updateForm(valueKey, Math.max(0, Number((value - 0.1).toFixed(1))))}
          >
            -
          </button>
          <div className="profile-slider-track">
            <div className="profile-slider-fill" style={{ width: `${value * 100}%` }} />
          </div>
          <button
            type="button"
            className="secondary-button profile-stepper-btn"
            onClick={() => updateForm(valueKey, Math.min(1, Number((value + 0.1).toFixed(1))))}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  async function saveSetup() {
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ").trim();
    const primaryPromptAnswer = form.prompts.find((item) => item.answer.trim())?.answer || profile.bio;

    await updateProfileDetails({
      name: fullName || profile.name,
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      age: form.age,
      gender: form.gender,
      username: form.username,
      religion: form.religion,
      goal: form.goal,
      frequency: form.frequency,
      hometown: form.hometown,
      city: form.hometown || profile.city,
      interests: form.selectedVibes,
      visitedStates: form.statesVisited,
      photos: form.photos,
      prompts: form.prompts,
      travelerDNA: {
        budgetStyle: form.budgetStyle,
        energyLevel: form.energyLevel,
        planningStyle: form.planningStyle,
        socialPreference: form.socialPreference,
      },
      bio: primaryPromptAnswer,
      travelStyle: form.selectedVibes[0] || profile.travelStyle,
      profileCompleted: true,
    });

    showToast({
      title: "Profile setup saved",
      message: "Your Roamio profile is now updated.",
      tone: "success",
    });
    setIsEditing(false);
    setStep(1);
  }

  const profilePreviewName = [form.firstName, form.lastName].filter(Boolean).join(" ") || profile.name;

  if (!showSetup && profile.profileCompleted) {
    return (
      <div className="page-grid">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Profile</p>
            <h2>{profile.name || "Roamio traveler"}</h2>
            <p>{profile.bio || "Your Roamio travel card is ready and can be updated anytime."}</p>
          </div>
          <div className="hero-glass-card">
            <p className="eyebrow">Status</p>
            <strong>{profile.level || "Explorer"}</strong>
            <p>{form.photos.filter(Boolean).length} photos saved</p>
          </div>
        </section>

        <section className="two-column-grid">
          <article className="panel profile-summary-card">
            <div className="profile-summary-head">
              <div>
                <p className="eyebrow">Travel card</p>
                <h3>{profile.name || "Roamio traveler"}</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setForm(buildFormFromProfile(profile));
                  setStep(1);
                  setError("");
                  setIsEditing(true);
                }}
              >
                Edit profile
              </button>
            </div>

            <div className="profile-summary-grid">
              <div className="list-card list-card-column">
                <strong>Home base</strong>
                <span>{profile.hometown || profile.city || "Mumbai"}</span>
              </div>
              <div className="list-card list-card-column">
                <strong>Travel style</strong>
                <span>{profile.travelStyle || "Flexible"}</span>
              </div>
              <div className="list-card list-card-column">
                <strong>Budget</strong>
                <span>{profile.budget || "Mid-range"}</span>
              </div>
              <div className="list-card list-card-column">
                <strong>Goal</strong>
                <span>{profile.goal || "Travel Buddy"}</span>
              </div>
            </div>

            <div className="tag-row">
              {(profile.interests || []).map((item) => (
                <span key={item} className="tag-pill">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="panel profile-summary-card">
            <p className="eyebrow">Photos</p>
            <div className="profile-photo-grid">
              {form.photos.map((photo, index) => (
                <div key={index} className="profile-photo-slot">
                  {photo ? (
                    <img src={photo} alt={`Saved ${index + 1}`} className="profile-photo-image" />
                  ) : (
                    <span className="profile-photo-empty">No photo</span>
                  )}
                  {index === 0 && <span className="profile-photo-badge">Profile</span>}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel profile-summary-card">
          <p className="eyebrow">Prompts</p>
          <div className="profile-prompts-list">
            {form.prompts.map((prompt, index) => (
              <div key={index} className="profile-prompt-card">
                <strong>{prompt.question}</strong>
                <p>{prompt.answer || "No answer added yet."}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Profile Setup</p>
          <h2>Build your travel card.</h2>
          <p>Move through identity, travel vibe, prompts, photos, and preview.</p>
        </div>
        <div className="hero-glass-card">
          <p className="eyebrow">Progress</p>
          <strong>
            Step {step} / {TOTAL_STEPS}
          </strong>
          <p>{completedPhotoCount} photos added</p>
        </div>
      </section>

      <section className="panel profile-setup-panel">
        <div className="profile-setup-header">
          <div className="profile-setup-actions">
            {step > 1 && (
              <button type="button" className="secondary-button" onClick={() => setStep((current) => current - 1)}>
                Back
              </button>
            )}
            {step < TOTAL_STEPS && (
              <button type="button" className="ghost-button" onClick={clearCurrentStep}>
                Clear step
              </button>
            )}
          </div>
          <div className="profile-progress-bar">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <span
                key={index}
                className={`profile-progress-segment ${index + 1 <= step ? "profile-progress-segment-active" : ""}`}
              />
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {step === 1 && (
          <div className="profile-step-body">
            <h3>Identity check</h3>
            <div className="form-grid">
              <input value={form.firstName} placeholder="First Name" onChange={(event) => updateForm("firstName", event.target.value)} />
              <input value={form.middleName} placeholder="Middle Name (Optional)" onChange={(event) => updateForm("middleName", event.target.value)} />
              <input value={form.lastName} placeholder="Last Name" onChange={(event) => updateForm("lastName", event.target.value)} />
              <input value={form.age} placeholder="Age" onChange={(event) => updateForm("age", event.target.value)} />
            </div>
            <div className="profile-chip-wrap">
              {["Male", "Female", "Non-binary", "Other"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`profile-chip ${form.gender === item ? "profile-chip-active" : ""}`}
                  onClick={() => updateForm("gender", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="profile-step-body">
            <h3>Security</h3>
            <div className="form-grid">
              <input value={form.username} placeholder="Username" onChange={(event) => updateForm("username", event.target.value)} />
              <input value={form.password} type="password" placeholder="Password" onChange={(event) => updateForm("password", event.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="profile-step-body">
            <h3>Religion</h3>
            <div className="profile-chip-wrap">
              {RELIGIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`profile-chip ${form.religion === item ? "profile-chip-active" : ""}`}
                  onClick={() => updateForm("religion", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="profile-step-body">
            <h3>Goal</h3>
            <div className="profile-chip-wrap">
              {RELATIONSHIP_GOALS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`profile-chip ${form.goal === item ? "profile-chip-active" : ""}`}
                  onClick={() => updateForm("goal", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="profile-step-body">
            <h3>Travel frequency</h3>
            <div className="profile-chip-wrap">
              {TRAVEL_FREQUENCY.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`profile-chip ${form.frequency === item ? "profile-chip-active" : ""}`}
                  onClick={() => updateForm("frequency", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="profile-step-body">
            <h3>Vibes</h3>
            <div className="profile-chip-wrap">
              {VIBES.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`profile-chip ${form.selectedVibes.includes(item) ? "profile-chip-active" : ""}`}
                  onClick={() => toggleMultiSelect("selectedVibes", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="profile-step-body">
            <h3>Traveller DNA</h3>
            {renderSlider("Budget Style", "budgetStyle")}
            {renderSlider("Energy Level", "energyLevel")}
            {renderSlider("Planning Style", "planningStyle")}
            {renderSlider("Social Preference", "socialPreference")}
          </div>
        )}

        {step === 8 && (
          <div className="profile-step-body">
            <h3>India footprint</h3>
            <div className="profile-chip-wrap">
              {INDIAN_STATES.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`profile-chip ${form.statesVisited.includes(item) ? "profile-chip-active" : ""}`}
                  onClick={() => {
                    if (item === "New to Travelling") {
                      updateForm("statesVisited", [item]);
                      return;
                    }

                    const cleaned = form.statesVisited.filter((state) => state !== "New to Travelling");
                    if (cleaned.includes(item)) {
                      updateForm(
                        "statesVisited",
                        cleaned.filter((state) => state !== item)
                      );
                    } else {
                      updateForm("statesVisited", [...cleaned, item]);
                    }
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="profile-step-body">
            <h3>Photos</h3>
            <p className="panel-subcopy">The first uploaded photo becomes the main preview image.</p>
            <div className="profile-photo-grid">
              {form.photos.map((photo, index) => (
                <button
                  type="button"
                  key={index}
                  className="profile-photo-slot"
                  onClick={() => fileInputsRef.current[index]?.click()}
                >
                  <input
                    ref={(node) => {
                      fileInputsRef.current[index] = node;
                    }}
                    type="file"
                    accept="image/*"
                    className="profile-hidden-input"
                    onChange={(event) => onPhotoUpload(index, event.target.files?.[0])}
                  />
                  {photo ? <img src={photo} alt={`Uploaded ${index + 1}`} className="profile-photo-image" /> : <span>+</span>}
                  {index === 0 && <span className="profile-photo-badge">Profile</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="profile-step-body">
            <h3>Where are you from?</h3>
            <input value={form.hometown} placeholder="e.g. Mumbai, Maharashtra" onChange={(event) => updateForm("hometown", event.target.value)} />
          </div>
        )}

        {step === 11 && (
          <div className="profile-step-body">
            <h3>Prompts</h3>
            <div className="profile-prompts-list">
              {form.prompts.map((prompt, index) => (
                <div key={index} className="profile-prompt-card">
                  <div className="profile-prompt-head">
                    <strong>{prompt.question}</strong>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setSelectedPromptIndex(index);
                        setShowPromptPicker(true);
                      }}
                    >
                      Change
                    </button>
                  </div>
                  <textarea
                    value={prompt.answer}
                    placeholder="Tap to answer..."
                    onChange={(event) => {
                      const nextPrompts = [...form.prompts];
                      nextPrompts[index] = { ...nextPrompts[index], answer: event.target.value };
                      updateForm("prompts", nextPrompts);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 12 && (
          <div className="profile-step-body">
            <h3>Card preview</h3>
            <div className="profile-preview-card">
              <div className="profile-preview-hero">
                <img
                  src={form.photos[0] || "https://via.placeholder.com/700x900?text=Roamio"}
                  alt="Profile preview"
                  className="profile-preview-main-image"
                />
                <div className="profile-preview-overlay">
                  <h2>
                    {profilePreviewName}
                    {form.age ? `, ${form.age}` : ""}
                  </h2>
                  <span className="tag-pill">{form.hometown || profile.city}</span>
                </div>
              </div>

              <div className="profile-preview-section">
                <small>{form.prompts[0].question}</small>
                <p>{form.prompts[0].answer || "..."}</p>
              </div>
              {form.photos[1] && <img src={form.photos[1]} alt="Gallery preview" className="profile-preview-gallery-image" />}
              <div className="profile-preview-section">
                <small>{form.prompts[1].question}</small>
                <p>{form.prompts[1].answer || "..."}</p>
              </div>
              {form.photos[2] && <img src={form.photos[2]} alt="Gallery preview" className="profile-preview-gallery-image" />}
              <div className="profile-preview-section">
                <small>{form.prompts[2].question}</small>
                <p>{form.prompts[2].answer || "..."}</p>
              </div>
            </div>
          </div>
        )}

        <div className="panel-actions">
          {step === TOTAL_STEPS ? (
            <button type="button" onClick={saveSetup}>
              Save profile
            </button>
          ) : (
            <button type="button" onClick={validateStep}>
              Continue
            </button>
          )}
        </div>
      </section>

      {showPromptPicker && (
        <div className="profile-modal-backdrop" onClick={() => setShowPromptPicker(false)}>
          <div className="profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal-header">
              <strong>Pick a prompt</strong>
              <button type="button" className="ghost-button" onClick={() => setShowPromptPicker(false)}>
                Close
              </button>
            </div>
            <div className="profile-modal-list">
              {PROMPT_OPTIONS.map((option, index) => (
                <button
                  type="button"
                  key={`${option.category}-${index}`}
                  className="profile-modal-option"
                  onClick={() => {
                    if (selectedPromptIndex === null) return;
                    const nextPrompts = [...form.prompts];
                    nextPrompts[selectedPromptIndex] = { ...nextPrompts[selectedPromptIndex], question: option.text };
                    updateForm("prompts", nextPrompts);
                    setShowPromptPicker(false);
                  }}
                >
                  <span>{option.category}</span>
                  <strong>{option.text}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
