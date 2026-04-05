import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { palette } from "../../src/theme/palette";

const TOTAL_STEPS = 8;
const PLACEHOLDER_INTERESTS = ["food", "culture", "photography", "Luxury Lover"];
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Jewish", "Atheist", "Spiritual", "Other", "Prefer not to say"];
const GOALS = ["Travel Buddy", "Adventure Partner", "Group Trips", "Just Exploring"];
const FREQUENCY = ["Once a year", "2-3 trips/year", "Every few months", "Monthly", "Always travelling"];
const BUDGETS = ["Budget-friendly", "Mid-range", "Flexible", "Premium"];
const VIBES = ["Luxury Lover", "Budget Backpacker", "Culture Explorer", "Party Nomad", "Nature Seeker", "Digital Nomad", "Foodie Traveler", "Adventure Junkie", "Slow Traveler", "Spiritual Explorer"];
const STATES = [  "New to Travelling",
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
  "West Bengal"];
const PROMPTS = [
  "My ideal trip looks like...",
  "The one place I'll always return to...",
  "My travel red flag is...",
  "The most spontaneous trip I ever took was...",
  "A perfect day while travelling includes...",
];
const LEVELS = [
  { level: "Explorer", minXp: 0 },
  { level: "Wanderer", minXp: 100 },
  { level: "Nomad", minXp: 300 },
  { level: "Trailblazer", minXp: 700 },
  { level: "Legend", minXp: 1500 },
];

type Draft = {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  username: string;
  religion: string;
  goal: string;
  frequency: string;
  budget: string;
  hobby: string;
  hometown: string;
  selectedVibes: string[];
  statesVisited: string[];
  photos: string[];
  prompts: { question: string; answer: string }[];
  budgetStyle: number;
  energyLevel: number;
  planningStyle: number;
  socialPreference: number;
};

function cleanInterests(interests: string[] = []) {
  return interests.filter((item) => !PLACEHOLDER_INTERESTS.includes(item));
}

function buildDraft(profile: ReturnType<typeof useAppData>["profile"]): Draft {
  return {
    firstName: profile.name.split(" ")?.[0] || "",
    lastName: profile.name.split(" ").slice(1).join(" ") || "",
    age: profile.age || "",
    gender: profile.gender || "",
    username: profile.username || "",
    religion: profile.religion || "",
    goal: profile.goal || "",
    frequency: profile.frequency || "",
    budget: profile.budget || "Mid-range",
    hobby: profile.hobby || "",
    hometown: profile.hometown || profile.city || "",
    selectedVibes: cleanInterests(profile.interests),
    statesVisited: profile.visitedStates || [],
    photos: [...Array(6)].map((_, index) => profile.photos[index] || ""),
    prompts: [
      { question: profile.prompts[0]?.question || PROMPTS[0], answer: profile.prompts[0]?.answer || "" },
      { question: profile.prompts[1]?.question || PROMPTS[1], answer: profile.prompts[1]?.answer || "" },
      { question: profile.prompts[2]?.question || PROMPTS[2], answer: profile.prompts[2]?.answer || "" },
    ],
    budgetStyle: profile.travelerDNA.budgetStyle ?? 0.5,
    energyLevel: profile.travelerDNA.energyLevel ?? 0.5,
    planningStyle: profile.travelerDNA.planningStyle ?? 0.5,
    socialPreference: profile.travelerDNA.socialPreference ?? 0.5,
  };
}

function vibeLabel(type: string, value: number) {
  if (type === "Budget Style") return value < 0.35 ? "Budget Seeker" : value < 0.7 ? "Balanced Spender" : "Luxury Lover";
  if (type === "Energy Level") return value < 0.35 ? "Chill & Relax" : value < 0.7 ? "Active Voyager" : "Adventure Junkie";
  if (type === "Planning Style") return value < 0.35 ? "Spontaneous" : value < 0.7 ? "Go with the flow" : "Master Planner";
  return value < 0.35 ? "Solo Soul" : value < 0.7 ? "Balanced" : "Social Butterfly";
}

function getLevelProgress(xp: number) {
  const current = [...LEVELS].reverse().find((item) => xp >= item.minXp) || LEVELS[0];
  const next = LEVELS.find((item) => item.minXp > xp);
  if (!next) return { progress: 1, next: null };
  return {
    progress: Math.max(0, Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp))),
    next,
  };
}

export default function Profile() {
  const { profile, updateProfileDetails } = useAppData();
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => buildDraft(profile));

  useEffect(() => {
    setDraft(buildDraft(profile));
  }, [profile]);

  const showSetup = editing || !profile.profileCompleted;
  const photoCount = draft.photos.filter(Boolean).length;
  const visibleInterests = useMemo(() => cleanInterests(profile.interests), [profile.interests]);
  const levelProgress = useMemo(() => getLevelProgress(profile.xp), [profile.xp]);
  const previewName = useMemo(
    () => [draft.firstName, draft.lastName].filter(Boolean).join(" ") || profile.name,
    [draft.firstName, draft.lastName, profile.name]
  );

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggle(key: "selectedVibes" | "statesVisited", value: string) {
    setDraft((current) => {
      const currentValues = current[key];
      return {
        ...current,
        [key]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  }

  function openEditor(targetStep: number) {
    setDraft(buildDraft(profile));
    setEditing(true);
    setStep(targetStep);
  }

  async function pickPhoto(index: number) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (result.canceled) return;
    setDraft((current) => {
      const photos = [...current.photos];
      photos[index] = result.assets[0].uri;
      return { ...current, photos };
    });
  }

  function validate() {
    setError("");
    if (step === 1 && (!draft.firstName || !draft.lastName || !draft.age || !draft.gender)) return setError("Complete identity fields.");
    if (step === 2 && (!draft.username || !draft.religion || !draft.goal || !draft.frequency)) return setError("Finish your preference details.");
    if (step === 5 && draft.statesVisited.length === 0) return setError("Select at least one state.");
    if (step === 6 && photoCount < 2) return setError("Upload at least 2 photos.");
    if (step === 7 && !draft.hometown) return setError("Add your hometown.");
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  async function saveProfile() {
    try {
      setSaving(true);
      await updateProfileDetails({
        name: previewName,
        age: draft.age,
        gender: draft.gender,
        username: draft.username,
        religion: draft.religion,
        goal: draft.goal,
        frequency: draft.frequency,
        budget: draft.budget,
        hobby: draft.hobby,
        hometown: draft.hometown,
        city: draft.hometown,
        interests: cleanInterests(draft.selectedVibes),
        visitedStates: draft.statesVisited,
        photos: draft.photos,
        profilePicture: draft.photos.find(Boolean) || profile.profilePicture,
        prompts: draft.prompts,
        bio: draft.prompts.find((item) => item.answer.trim())?.answer || profile.bio,
        travelStyle: cleanInterests(draft.selectedVibes)[0] || profile.travelStyle,
        travelerDNA: {
          budgetStyle: draft.budgetStyle,
          energyLevel: draft.energyLevel,
          planningStyle: draft.planningStyle,
          socialPreference: draft.socialPreference,
        },
        profileCompleted: true,
      });
      Alert.alert("Profile setup saved", "Your Roamio profile is now updated.");
      setEditing(false);
      setStep(1);
    } finally {
      setSaving(false);
    }
  }

  if (!showSetup) {
    return (
      <Screen title="Profile" subtitle="Your Roamio travel card is ready and can be updated anytime.">
        <Panel>
          <View style={styles.summaryHead}>
            <View>
              <Eyebrow>Travel Card</Eyebrow>
              <Text style={styles.title}>{profile.name}</Text>
              <View style={styles.levelRow}>
                <View style={styles.levelChip}><Text style={styles.levelChipText}>{profile.level}</Text></View>
                <Text style={styles.meta}>{profile.xp} XP • {profile.streak} day streak</Text>
              </View>
              <Text style={styles.meta}>{profile.hometown || profile.city} • {profile.travelStyle}</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => openEditor(1)}
            >
              <Text style={styles.secondaryText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${levelProgress.progress * 100}%` }]} />
          </View>
          <Text style={styles.meta}>
            {levelProgress.next ? `${levelProgress.next.minXp - profile.xp} XP to ${levelProgress.next.level}` : "Max level reached"}
          </Text>
          <View style={styles.grid}>
            {[
              ["Home base", profile.hometown || profile.city || "Mumbai", 7],
              ["Travel style", profile.travelStyle || "Flexible", 3],
              ["Budget", profile.budget || "Mid-range", 2],
              ["Goal", profile.goal || "Travel Buddy", 2],
            ].map(([label, value, targetStep]) => (
              <TouchableOpacity key={String(label)} style={styles.infoBox} onPress={() => openEditor(Number(targetStep))} activeOpacity={0.85}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.summaryEditRow}>
            <Text style={styles.editHint}>Interests & vibes. Tap any tag to change what shows here.</Text>
            <TouchableOpacity style={styles.inlineEditButton} onPress={() => openEditor(3)}>
              <Text style={styles.inlineEditText}>Edit interests</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chips}>
            {visibleInterests.map((item) => (
              <TouchableOpacity key={item} style={styles.chip} onPress={() => openEditor(3)} activeOpacity={0.85}>
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {visibleInterests.length === 0 ? <Text style={styles.meta}>No interests added yet.</Text> : null}
        </Panel>

        <Panel>
          <Eyebrow>Badges</Eyebrow>
          {profile.badges.length === 0 ? (
            <Text style={styles.meta}>No badges unlocked yet.</Text>
          ) : (
            <View style={styles.chips}>
              {profile.badges.map((badge) => (
                <View key={badge} style={styles.badgeChip}><Text style={styles.badgeChipText}>{badge}</Text></View>
              ))}
            </View>
          )}
        </Panel>

        <Panel>
          <Eyebrow>Photos</Eyebrow>
          {(profile.photos || []).filter(Boolean).length === 0 ? (
            <Text style={styles.meta}>No photos uploaded yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.summaryPhotoRow}>
                {profile.photos.filter(Boolean).map((photo, index) => (
                  <TouchableOpacity key={`${photo}-${index}`} onPress={() => setZoomImage(photo)}>
                    <Image source={{ uri: photo }} style={styles.summaryPhoto} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </Panel>

        <Panel>
          <Eyebrow>Prompts</Eyebrow>
          {profile.prompts.map((prompt, index) => (
            <View key={`${prompt.question}-${index}`} style={styles.promptCard}>
              <Text style={styles.promptQuestion}>{prompt.question}</Text>
              <Text style={styles.promptAnswer}>{prompt.answer || "No answer added yet."}</Text>
            </View>
          ))}
        </Panel>

        <Modal visible={Boolean(zoomImage)} transparent animationType="fade">
          <Pressable style={styles.zoomBackdrop} onPress={() => setZoomImage(null)}>
            {zoomImage ? <Image source={{ uri: zoomImage }} style={styles.zoomImage} /> : null}
          </Pressable>
        </Modal>
      </Screen>
    );
  }

  return (
    <Screen title="Profile Setup" subtitle="Move through identity, preferences, travel DNA, prompts, photos, and preview.">
      <Panel>
        <View style={styles.progressHead}>
          <View>
            <Eyebrow>Progress</Eyebrow>
            <Text style={styles.title}>Step {step} / {TOTAL_STEPS}</Text>
            <Text style={styles.meta}>{photoCount} photos added</Text>
          </View>
          {step > 1 ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep((current) => current - 1)}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={`seg-${index}`} style={[styles.progressSegment, index + 1 <= step && styles.progressActive]} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Panel>

      {step === 1 ? (
        <Panel>
          <Eyebrow>Identity Check</Eyebrow>
          <TextInput style={styles.input} value={draft.firstName} onChangeText={(value) => setField("firstName", value)} placeholder="First Name" placeholderTextColor={palette.textDim} />
          <TextInput style={styles.input} value={draft.lastName} onChangeText={(value) => setField("lastName", value)} placeholder="Last Name" placeholderTextColor={palette.textDim} />
          <TextInput style={styles.input} value={draft.age} onChangeText={(value) => setField("age", value)} placeholder="Age" keyboardType="number-pad" placeholderTextColor={palette.textDim} />
          <View style={styles.chips}>
            {["Male", "Female", "Non-binary", "Other"].map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.gender === item && styles.chipActive]} onPress={() => setField("gender", item)}>
                <Text style={[styles.chipText, draft.gender === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Panel>
      ) : null}

      {step === 2 ? (
        <Panel>
          <Eyebrow>Preferences</Eyebrow>
          <TextInput style={styles.input} value={draft.username} onChangeText={(value) => setField("username", value)} placeholder="Username" placeholderTextColor={palette.textDim} />
          <View style={styles.chips}>
            {RELIGIONS.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.religion === item && styles.chipActive]} onPress={() => setField("religion", item)}>
                <Text style={[styles.chipText, draft.religion === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chips}>
            {GOALS.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.goal === item && styles.chipActive]} onPress={() => setField("goal", item)}>
                <Text style={[styles.chipText, draft.goal === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chips}>
            {BUDGETS.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.budget === item && styles.chipActive]} onPress={() => setField("budget", item)}>
                <Text style={[styles.chipText, draft.budget === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chips}>
            {FREQUENCY.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.frequency === item && styles.chipActive]} onPress={() => setField("frequency", item)}>
                <Text style={[styles.chipText, draft.frequency === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Panel>
      ) : null}

      {step === 3 ? (
        <Panel>
          <Eyebrow>Interests & Vibes</Eyebrow>
          <Text style={styles.meta}>Choose the tags you want on your profile card, like food, culture, photography, or Luxury Lover.</Text>
          <View style={styles.chips}>
            {VIBES.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.selectedVibes.includes(item) && styles.chipActive]} onPress={() => toggle("selectedVibes", item)}>
                <Text style={[styles.chipText, draft.selectedVibes.includes(item) && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Panel>
      ) : null}

      {step === 4 ? (
        <Panel>
          <Eyebrow>Traveller DNA</Eyebrow>
          {[
            ["Budget Style", "budgetStyle"],
            ["Energy Level", "energyLevel"],
            ["Planning Style", "planningStyle"],
            ["Social Preference", "socialPreference"],
          ].map(([label, key]) => {
            const current = draft[key as keyof Draft] as number;
            return (
              <View key={label} style={styles.sliderBlock}>
                <View style={styles.sliderHead}>
                  <Text style={styles.rowTitle}>{label}</Text>
                  <Text style={styles.sliderLabel}>{vibeLabel(label, current)}</Text>
                </View>
                <View style={styles.sliderRow}>
                  <TouchableOpacity style={styles.stepButton} onPress={() => setField(key as keyof Draft, Math.max(0, Number((current - 0.1).toFixed(1))) as never)}>
                    <Text style={styles.stepText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${current * 100}%` }]} />
                  </View>
                  <TouchableOpacity style={styles.stepButton} onPress={() => setField(key as keyof Draft, Math.min(1, Number((current + 0.1).toFixed(1))) as never)}>
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Panel>
      ) : null}

      {step === 5 ? (
        <Panel>
          <Eyebrow>India Footprint</Eyebrow>
          <View style={styles.chips}>
            {STATES.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, draft.statesVisited.includes(item) && styles.chipActive]} onPress={() => toggle("statesVisited", item)}>
                <Text style={[styles.chipText, draft.statesVisited.includes(item) && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Panel>
      ) : null}

      {step === 6 ? (
        <Panel>
          <Eyebrow>Photos</Eyebrow>
          <Text style={styles.meta}>The first uploaded photo becomes the main preview image.</Text>
          <View style={styles.photoGrid}>
            {draft.photos.map((photo, index) => (
              <TouchableOpacity key={`photo-${index}`} style={styles.photoSlot} onPress={() => pickPhoto(index)}>
                {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <Text style={styles.plus}>+</Text>}
                {index === 0 ? <Text style={styles.photoBadge}>Profile</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </Panel>
      ) : null}

      {step === 7 ? (
        <Panel>
          <Eyebrow>Hometown and Prompts</Eyebrow>
          <TextInput style={styles.input} value={draft.hometown} onChangeText={(value) => setField("hometown", value)} placeholder="e.g. Mumbai, Maharashtra" placeholderTextColor={palette.textDim} />
          <TextInput style={styles.input} value={draft.hobby} onChangeText={(value) => setField("hobby", value)} placeholder="My hobby is..." placeholderTextColor={palette.textDim} />
          {draft.prompts.map((prompt, index) => (
            <View key={`prompt-${index}`} style={styles.promptCard}>
              <Text style={styles.promptQuestion}>{prompt.question}</Text>
              <TextInput
                style={styles.promptInput}
                value={prompt.answer}
                onChangeText={(value) =>
                  setField(
                    "prompts",
                    draft.prompts.map((item, itemIndex) => (itemIndex === index ? { ...item, answer: value } : item))
                  )
                }
                multiline
                placeholder="Tap to answer..."
                placeholderTextColor={palette.textDim}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.promptChoices}>
                  {PROMPTS.map((option) => (
                    <TouchableOpacity
                      key={`${index}-${option}`}
                      style={styles.promptChoice}
                      onPress={() =>
                        setField(
                          "prompts",
                          draft.prompts.map((item, itemIndex) => (itemIndex === index ? { ...item, question: option } : item))
                        )
                      }
                    >
                      <Text style={styles.promptChoiceText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}
        </Panel>
      ) : null}

      {step === 8 ? (
        <Panel>
          <Eyebrow>Card Preview</Eyebrow>
          <View style={styles.preview}>
            {draft.photos[0] ? <Image source={{ uri: draft.photos[0] }} style={styles.previewPhoto} /> : <View style={styles.previewEmpty}><Text style={styles.meta}>No profile image</Text></View>}
            <Text style={styles.title}>{previewName}{draft.age ? `, ${draft.age}` : ""}</Text>
            <Text style={styles.meta}>{draft.hometown || profile.city}</Text>
            {draft.hobby ? <Text style={styles.meta}>My hobby is {draft.hobby}</Text> : null}
            {draft.prompts.map((prompt, index) => (
              <View key={`preview-${index}`} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                <Text style={styles.promptAnswer}>{prompt.answer || "..."}</Text>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}

      <TouchableOpacity style={styles.primaryButton} onPress={step === TOTAL_STEPS ? saveProfile : validate} disabled={saving}>
        <Text style={styles.primaryText}>{step === TOTAL_STEPS ? (saving ? "Saving..." : "Save Profile") : "Continue"}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { color: palette.text, fontSize: 22, fontWeight: "800" },
  meta: { color: palette.textMuted, marginTop: 4, lineHeight: 20 },
  levelRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 8 },
  levelChip: { backgroundColor: "rgba(25,196,182,0.14)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  levelChipText: { color: palette.teal, fontWeight: "900" },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: palette.panelAlt, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: palette.teal },
  progressBar: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  progressSegment: { height: 8, minWidth: "11%", flexGrow: 1, borderRadius: 999, backgroundColor: palette.panelAlt },
  progressActive: { backgroundColor: palette.teal },
  error: { color: palette.coral, fontWeight: "700" },
  input: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: palette.panelAlt,
    color: palette.text,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: palette.panelAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: { backgroundColor: palette.teal, borderColor: palette.teal },
  chipText: { color: palette.textMuted, fontWeight: "700" },
  chipTextActive: { color: palette.bg },
  badgeChip: { backgroundColor: "rgba(25,196,182,0.14)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(25,196,182,0.24)" },
  badgeChipText: { color: palette.text, fontWeight: "800" },
  sliderBlock: { gap: 10 },
  sliderHead: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowTitle: { color: palette.text, fontWeight: "800" },
  sliderLabel: { color: palette.teal, fontWeight: "800" },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.panelAlt, justifyContent: "center", alignItems: "center" },
  stepText: { color: palette.text, fontWeight: "900", fontSize: 22 },
  sliderTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: palette.panelAlt, overflow: "hidden" },
  sliderFill: { height: "100%", backgroundColor: palette.teal },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoSlot: { width: "47%", aspectRatio: 0.8, borderRadius: 20, backgroundColor: palette.panelAlt, justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" },
  photo: { width: "100%", height: "100%" },
  plus: { color: palette.teal, fontSize: 30, fontWeight: "900" },
  photoBadge: { position: "absolute", top: 10, right: 10, backgroundColor: palette.teal, color: palette.bg, fontWeight: "800", fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  promptCard: { backgroundColor: palette.panelAlt, borderRadius: 18, padding: 14, gap: 8 },
  promptQuestion: { color: palette.teal, fontWeight: "800" },
  promptAnswer: { color: palette.text, lineHeight: 22 },
  promptInput: { minHeight: 84, color: palette.text, textAlignVertical: "top" },
  promptChoices: { flexDirection: "row", gap: 8 },
  promptChoice: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  promptChoiceText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  preview: { gap: 12 },
  previewPhoto: { width: "100%", height: 280, borderRadius: 20 },
  previewEmpty: { height: 220, borderRadius: 20, backgroundColor: palette.panelAlt, justifyContent: "center", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoBox: { width: "47%", backgroundColor: palette.panelAlt, borderRadius: 18, padding: 14 },
  infoLabel: { color: palette.textDim, fontSize: 12, fontWeight: "700" },
  infoValue: { color: palette.text, fontWeight: "800", marginTop: 6 },
  summaryEditRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  editHint: { color: palette.textDim, flex: 1, lineHeight: 18 },
  inlineEditButton: { backgroundColor: "rgba(25,196,182,0.14)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(25,196,182,0.24)" },
  inlineEditText: { color: palette.teal, fontWeight: "800" },
  secondaryButton: { backgroundColor: palette.panelAlt, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  secondaryText: { color: palette.text, fontWeight: "800" },
  primaryButton: { marginHorizontal: 18, backgroundColor: palette.teal, minHeight: 56, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  primaryText: { color: palette.bg, fontWeight: "900", fontSize: 15 },
  summaryPhotoRow: { flexDirection: "row", gap: 12 },
  summaryPhoto: { width: 160, height: 220, borderRadius: 18, backgroundColor: palette.panelAlt },
  zoomBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  zoomImage: {
    width: "90%",
    height: "68%",
    borderRadius: 24,
  },
});
