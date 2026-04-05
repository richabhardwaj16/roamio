import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { askAI, getAiHealth } from "../../src/services/ai";
import { sampleQuiz } from "../../src/data/mockData";

type BlendPreference = {
  budget: "Any" | "Budget-friendly" | "Mid-range" | "Flexible" | "Premium";
  pace: "Any" | "Relaxed" | "Flexible" | "Explorer" | "Fast-paced";
  destination: "Open" | "Match Mine";
};

function fallbackPhotos() {
  return [
    "https://via.placeholder.com/900x1200/f0ede7/223042?text=Roamio",
    "https://via.placeholder.com/900x1200/e9f3f6/223042?text=Travel",
    "https://via.placeholder.com/900x1200/f8e9dd/223042?text=Memory",
  ];
}

function buildMedia(profile: { photos: string[]; prompts: { question: string; answer: string }[] }) {
  const photos = (profile.photos || []).filter(Boolean);
  const prompts = (profile.prompts || []).filter((item) => item.question);
  const usablePhotos = photos.length > 0 ? photos : fallbackPhotos();
  const media: ({ type: "image"; source: string; id: string } | { type: "prompt"; question: string; answer: string; id: string })[] = [];

  usablePhotos.slice(0, 5).forEach((photo, index) => {
    media.push({ type: "image", source: photo, id: `image-${index}` });
    if (prompts[index]) media.push({ type: "prompt", ...prompts[index], id: `prompt-${index}` });
  });

  return media;
}

function notificationStamp(time: string | undefined, index: number) {
  if (time) return time;
  if (index === 0) return "Just now";
  if (index === 1) return "A moment ago";
  return "Recently";
}

function buildDna(profile: { travelerDNA: { socialPreference: number; budgetStyle: number; planningStyle: number; energyLevel: number }; interests: string[] }) {
  return {
    vibe: profile.travelerDNA?.socialPreference ?? 0.5,
    budget: profile.travelerDNA?.budgetStyle ?? 0.5,
    spontaneity: 1 - (profile.travelerDNA?.planningStyle ?? 0.5),
    food: profile.interests?.includes("Foodie Traveler") || profile.interests?.includes("food") ? 0.9 : 0.6,
    adventure: profile.interests?.includes("Adventure Junkie") || profile.interests?.includes("adventure") ? 0.9 : profile.travelerDNA?.energyLevel ?? 0.5,
  };
}

function getCompatibility(dna: ReturnType<typeof buildDna>) {
  return Math.floor(((dna.vibe + dna.budget + dna.spontaneity + dna.food + dna.adventure) / 5) * 100);
}

function getAIInsight(
  dna: ReturnType<typeof buildDna>,
  person: { id: string; name: string; destination: string; budget: string; travelStyle: string }
) {
  const traits = [
    { name: "adventure", val: dna.adventure, text: `Expect detours. ${person.destination} rewards bold energy.` },
    { name: "budget", val: dna.budget, text: `Smart spending unlocks the best of ${person.destination}.` },
    { name: "spontaneity", val: dna.spontaneity, text: "Loose plans work best here. Keep the route flexible." },
    { name: "food", val: dna.food, text: `Food should shape this itinerary around ${person.destination}.` },
    { name: "vibe", val: dna.vibe, text: "This travel mood is people-first and conversation-friendly." },
  ].sort((a, b) => b.val - a.val);

  return traits[0]?.text || `${person.travelStyle} travel energy fits this route well.`;
}

function describeTraveler(
  traveler: { name?: string; interests?: string[]; budget?: string; travelStyle?: string; destination?: string; travelerDNA?: { socialPreference?: number; planningStyle?: number; energyLevel?: number } },
  label: string
) {
  const interests = (traveler.interests || []).join(", ") || "open to discovery";
  return `${label}: ${traveler.name || "Traveler"} | Interests: ${interests} | Budget: ${traveler.budget || "flexible"} | Travel style: ${traveler.travelStyle || "balanced"} | Preferred destination: ${traveler.destination || "flexible destinations"}`;
}

function buildBlendPrompt(
  host: { name?: string; destination?: string; budget?: string; travelStyle?: string; interests?: string[]; travelerDNA?: { socialPreference?: number; planningStyle?: number; energyLevel?: number } },
  buddies: { name: string; destination: string; budget: string; travelStyle: string; interests: string[]; travelerDNA: { socialPreference: number; planningStyle: number; energyLevel: number } }[],
  mode: "duo" | "group",
  preferences: BlendPreference
) {
  return [
    `Blend mode requested: ${mode === "duo" ? "Duo" : "Group"}`,
    `Budget preference: ${preferences.budget}`,
    `Trip pace preference: ${preferences.pace}`,
    `Destination preference: ${preferences.destination}`,
    "Choose the most compatible set of travelers.",
    "Return: why they match, suggested destination, mini trip plan, and travel tips.",
    describeTraveler(host, "Traveler A (you)"),
    ...buddies.map((buddy, index) => describeTraveler(buddy, `Traveler ${String.fromCharCode(66 + index)}`)),
  ].join("\n");
}

function buildBlendFallbackSummary(
  profile: ReturnType<typeof useAppData>["profile"],
  buddies: ReturnType<typeof useAppData>["buddies"],
  mode: "duo" | "group",
  preferences: BlendPreference
) {
  const names = buddies.map((buddy) => buddy.name).join(", ") || "No matches yet";
  const destination = preferences.destination === "Match Mine" ? profile.destination : "flexible destinations";
  const budget = preferences.budget === "Any" ? profile.budget : preferences.budget;
  const pace = preferences.pace === "Any" ? profile.travelStyle : preferences.pace;

  return [
    `Suggested ${mode} blend: ${names}.`,
    `Destination focus: ${destination}.`,
    `Budget fit: ${budget}.`,
    `Trip pace: ${pace}.`,
    "Next step: open the chat thread and align dates, transport, and lodging.",
  ].join(" ");
}

function getPreferredMatches(
  buddies: (ReturnType<typeof useAppData>["buddies"][number])[],
  profile: ReturnType<typeof useAppData>["profile"],
  mode: "duo" | "group",
  preferences: BlendPreference
) {
  const ranked = [...buddies]
    .map((buddy) => {
      let score = buddy.matchScore || 0;

      if (preferences.destination === "Match Mine" && buddy.destination === profile.destination) score += 30;
      if (preferences.budget !== "Any" && buddy.budget === preferences.budget) score += 24;
      if (preferences.pace !== "Any" && buddy.travelStyle === preferences.pace) score += 20;

      if (preferences.budget === "Any" && buddy.budget === profile.budget) score += 12;
      if (preferences.pace === "Any" && buddy.travelStyle === profile.travelStyle) score += 12;
      if (preferences.destination === "Open" && buddy.destination === profile.destination) score += 8;

      return { ...buddy, preferenceScore: score };
    })
    .sort((left, right) => right.preferenceScore - left.preferenceScore);

  return ranked.slice(0, mode === "duo" ? 1 : 3);
}

export default function Home() {
  const { profile, buddies = [], allProfiles, notifications, dismissNotification, recordGamificationAction } = useAppData();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, gradients } = theme;
  const [blendMode, setBlendMode] = useState<"duo" | "group">("group");
  const [blendOverlayVisible, setBlendOverlayVisible] = useState(false);
  const [blendLoading, setBlendLoading] = useState(false);
  const [blendResult, setBlendResult] = useState("");
  const [blendError, setBlendError] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [blendPreferences, setBlendPreferences] = useState<BlendPreference>({
    budget: "Any",
    pace: "Any",
    destination: "Match Mine",
  });
  const [aiHealth, setAiHealth] = useState({ loading: true, ok: false, message: "Checking AI", model: "" });
  const [activeQuiz] = useState(() => sampleQuiz[Math.floor(Math.random() * sampleQuiz.length)] || sampleQuiz[0]);
  const [quizState, setQuizState] = useState({ open: false, result: "" });

  const focusedMatches = useMemo(
    () => getPreferredMatches(buddies, profile, blendMode, blendPreferences),
    [blendMode, blendPreferences, buddies, profile]
  );
  const visibleProfiles = useMemo(() => allProfiles.slice(0, visibleCount), [allProfiles, visibleCount]);

  useFocusEffect(
    useCallback(() => {
      setBlendOverlayVisible(false);
      setBlendLoading(false);
      setBlendError("");
      setZoomImage(null);

      return () => {
        setBlendOverlayVisible(false);
        setBlendLoading(false);
        setBlendError("");
        setZoomImage(null);
      };
    }, [])
  );

  useEffect(() => {
    async function loadHealth() {
      const result = await getAiHealth();
      setAiHealth({ loading: false, ok: result.ok, message: result.message || "", model: String((result as { model?: string }).model || "") });
    }
    loadHealth();
  }, []);

  async function answerQuiz(option: string) {
    const correct = option === activeQuiz.answer;
    const result = correct ? "Correct. You unlocked 10 explorer points." : "Not quite. Try again later.";
    setQuizState({ open: true, result });
    try {
      await recordGamificationAction("complete_quiz");
    } catch {
      // Keep quiz interaction working even if XP sync fails.
    }
    Alert.alert(correct ? "Quiz answered correctly" : "Quiz answer saved", result);
  }

  async function handleBlend() {
    const selected = focusedMatches;
    setBlendOverlayVisible(true);
    setBlendError("");
    setBlendResult("");

    if (selected.length === 0) {
      setBlendError("No compatible travelers yet. Update your profile or explore to unlock duo/group blends.");
      return;
    }

    setBlendLoading(true);
    try {
      setBlendResult(await askAI(buildBlendPrompt(profile, selected, blendMode, blendPreferences), "blend-match"));
    } catch (error) {
      setBlendError("");
      setBlendResult(buildBlendFallbackSummary(profile, selected, blendMode, blendPreferences));
    } finally {
      setBlendLoading(false);
    }
  }

  return (
    <Screen title="Community Feed" subtitle="Your journey starts here..." scroll={false}>
      <View style={styles.screenBody}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollBody, { paddingBottom: 140 + insets.bottom }]}
        >
          <Panel>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Community travel feed</Text>
              <Text style={[styles.headerMeta, { color: colors.textMuted }]}>{allProfiles.length} profiles visible</Text>
            </View>
          </Panel>

          <Panel>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{activeQuiz.question}</Text>
            <View style={styles.quizWrap}>
              {activeQuiz.options.map((option) => (
                <TouchableOpacity key={option} style={[styles.quizOption, { backgroundColor: colors.panelAlt, borderColor: colors.border }]} onPress={() => answerQuiz(option)}>
                  <Text style={[styles.quizText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {quizState.open ? <Text style={[styles.quizResult, { color: colors.success }]}>{quizState.result}</Text> : null}
          </Panel>

          {notifications.length > 0 ? (
            <Panel>
              <View style={styles.headerRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Live notifications</Text>
                <Text style={[styles.metaTag, { color: colors.teal }]}>{notifications.length} active</Text>
              </View>
              <View style={styles.noteList}>
                {notifications.slice(0, 3).map((item, index) => (
                  <View key={item.id} style={[styles.noteCard, { backgroundColor: colors.panelAlt }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.metaTag, { color: colors.teal }]}>{notificationStamp(item.time, index)}</Text>
                      <Text style={[styles.noteTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.copy, { color: colors.textMuted }]}>{item.body}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.clearButton, { borderColor: colors.border }]}
                      onPress={async () => {
                        await dismissNotification(item.id);
                        Alert.alert("Notification cleared", "The alert was removed from your travel feed.");
                      }}
                    >
                      <Text style={[styles.clearText, { color: colors.text }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </Panel>
          ) : null}

          <Panel>
            <View style={styles.modeRow}>
              {(["duo", "group"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    { backgroundColor: colors.panelAlt, borderColor: colors.border },
                    blendMode === mode && { backgroundColor: colors.teal, borderColor: colors.teal },
                  ]}
                  onPress={() => setBlendMode(mode)}
                >
                  <Text style={[styles.modeText, { color: blendMode === mode ? colors.bg : colors.text }]}>{mode === "duo" ? "Duo" : "Group"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.preferenceBlock}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Budget fit</Text>
              <View style={styles.preferenceRow}>
                {(["Any", "Budget-friendly", "Mid-range", "Flexible", "Premium"] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.preferenceChip,
                      { backgroundColor: colors.panelAlt, borderColor: colors.border },
                      blendPreferences.budget === option && { backgroundColor: colors.bgSoft, borderColor: colors.teal },
                    ]}
                    onPress={() => setBlendPreferences((current) => ({ ...current, budget: option }))}
                  >
                    <Text style={[styles.preferenceChipText, { color: blendPreferences.budget === option ? colors.teal : colors.textMuted }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.preferenceBlock}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Trip pace</Text>
              <View style={styles.preferenceRow}>
                {(["Any", "Relaxed", "Flexible", "Explorer", "Fast-paced"] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.preferenceChip,
                      { backgroundColor: colors.panelAlt, borderColor: colors.border },
                      blendPreferences.pace === option && { backgroundColor: colors.bgSoft, borderColor: colors.teal },
                    ]}
                    onPress={() => setBlendPreferences((current) => ({ ...current, pace: option }))}
                  >
                    <Text style={[styles.preferenceChipText, { color: blendPreferences.pace === option ? colors.teal : colors.textMuted }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.preferenceBlock}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Destination fit</Text>
              <View style={styles.preferenceRow}>
                {(["Match Mine", "Open"] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.preferenceChip,
                      { backgroundColor: colors.panelAlt, borderColor: colors.border },
                      blendPreferences.destination === option && { backgroundColor: colors.bgSoft, borderColor: colors.teal },
                    ]}
                    onPress={() => setBlendPreferences((current) => ({ ...current, destination: option }))}
                  >
                    <Text style={[styles.preferenceChipText, { color: blendPreferences.destination === option ? colors.teal : colors.textMuted }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={[styles.copy, { color: colors.textMuted }]}>
              {blendMode === "duo" ? "Targeting one travel buddy for a focused duo." : "Designing a small group blend (3-5 people)."}
            </Text>
            {focusedMatches.length > 0 ? (
              <Text style={[styles.copy, { color: colors.textMuted }]}>
                Suggested {blendMode}: {focusedMatches.map((buddy) => buddy.name).join(", ")}
              </Text>
            ) : null}
            <Text style={[styles.metaTag, { color: aiHealth.loading ? colors.amber : aiHealth.ok ? colors.success : colors.coral }]}>
              {aiHealth.loading ? "AI: checking..." : aiHealth.ok ? `AI ready${aiHealth.model ? ` (${aiHealth.model})` : ""}` : `AI offline: ${aiHealth.message || "unknown"}`}
            </Text>
          </Panel>

          {visibleProfiles.map((person) => {
            const media = buildMedia(person).slice(0, 3);
            const dna = buildDna(person);
            const compatibility = getCompatibility(dna);

            return (
              <View key={person.id} style={styles.feedBlock}>
                <Panel>
                  <View style={styles.idCard}>
                    <View style={{ flex: 1 }}>
                      <Eyebrow>Now Exploring</Eyebrow>
                      <Text style={[styles.nameText, { color: colors.text }]}>
                        {person.name}
                        {person.age ? `, ${person.age}` : ""}
                      </Text>
                      <Text style={[styles.copy, { color: colors.textMuted }]}>{person.bio || "Travel profile ready for discovery."}</Text>
                    </View>
                    <View style={styles.idMeta}>
                      <View style={[styles.matchBadge, { backgroundColor: colors.bgSoft }]}>
                        <Text style={[styles.matchBadgeValue, { color: colors.teal }]}>
                          {person.matchScore ?? compatibility}%
                        </Text>
                        <Text style={[styles.matchBadgeLabel, { color: colors.textDim }]}>MATCH</Text>
                      </View>
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>{person.hometown || person.city || "India"}</Text>
                      <Text style={[styles.metaTag, { color: colors.teal }]}>{person.level || "Explorer"}</Text>
                    </View>
                  </View>
                </Panel>

                {media.map((item) =>
                  item.type === "image" ? (
                    <TouchableOpacity key={`${person.id}-${item.id}`} activeOpacity={0.92} onPress={() => setZoomImage(item.source)}>
                      <Image source={item.source} style={styles.imageCard} contentFit="cover" cachePolicy="memory-disk" transition={120} />
                    </TouchableOpacity>
                  ) : (
                    <Panel key={`${person.id}-${item.id}`}>
                      <Text style={[styles.promptQ, { color: colors.text }]}>{item.question}</Text>
                      <Text style={[styles.promptA, { color: colors.textMuted }]}>{item.answer || "..."}</Text>
                    </Panel>
                  )
                )}

                <Panel>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Travel snapshot</Text>
                  <Text style={[styles.copy, { color: colors.textMuted }]}>{getAIInsight(dna, person)}</Text>
                  <View style={styles.snapshotRow}>
                    <View style={[styles.fitBox, { backgroundColor: colors.panelAlt }]}>
                      <Text style={[styles.fitValue, { color: colors.text }]}>{compatibility}%</Text>
                      <Text style={[styles.fitLabel, { color: colors.textDim }]}>FIT</Text>
                    </View>
                    <View style={styles.tags}>
                      {(person.interests || []).slice(0, 4).map((interest) => (
                        <View key={`${person.id}-${interest}`} style={[styles.tag, { backgroundColor: colors.bgSoft }]}>
                          <Text style={[styles.tagText, { color: colors.textMuted }]}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Panel>
              </View>
            );
          })}

          {visibleCount < allProfiles.length ? (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.panelAlt, borderColor: colors.border }]}
              onPress={() => setVisibleCount((current) => Math.min(allProfiles.length, current + 6))}
            >
              <Text style={[styles.loadMoreText, { color: colors.text }]}>
                Show more travelers ({allProfiles.length - visibleCount} left)
              </Text>
            </TouchableOpacity>
          ) : (
            <Panel>
              <Text style={[styles.copy, { color: colors.textMuted }]}>
                Showing all {allProfiles.length} travelers in your feed.
              </Text>
            </Panel>
          )}

          {allProfiles.length === 0 ? (
            <Panel>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>No traveler cards yet</Text>
              <Text style={[styles.copy, { color: colors.textMuted }]}>
                Reload the app or open Friends to refresh the feed. This screen now clears stale overlays automatically.
              </Text>
            </Panel>
          ) : null}
        </ScrollView>
      </View>

      <View style={[styles.floatingDock, { bottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.panelAlt }]} onPress={() => setZoomImage(null)}>
          <Text style={[styles.iconText, { color: colors.text }]}>x</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.blendWrap} onPress={handleBlend}>
          <LinearGradient colors={gradients.accent} style={styles.blendMain}>
            <Text style={[styles.blendMainText, { color: colors.text }]}>Blend DNA</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.panelAlt }]} onPress={() => Alert.alert("Saved", "This profile mood has been saved to your session.")}>
          <Text style={[styles.iconText, { color: colors.text }]}>like</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={Boolean(zoomImage)} transparent animationType="fade" onRequestClose={() => setZoomImage(null)}>
        <Pressable style={styles.overlay} onPress={() => setZoomImage(null)}>
          {zoomImage ? <Image source={zoomImage} style={styles.zoomImage} contentFit="contain" cachePolicy="memory-disk" transition={120} /> : null}
        </Pressable>
      </Modal>

      <Modal visible={blendOverlayVisible} transparent animationType="fade" onRequestClose={() => setBlendOverlayVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => !blendLoading && setBlendOverlayVisible(false)} />
          <View style={[styles.blendSheet, { backgroundColor: colors.panel }]}>
            <View style={styles.blendSheetContent}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Eyebrow>Blend AI Match</Eyebrow>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Travelers in sync</Text>
                  <Text style={[styles.copy, { color: colors.textMuted }]}>Matching interests, budgets, and safety insights.</Text>
                </View>
                <TouchableOpacity style={[styles.clearButton, { borderColor: colors.border }]} disabled={blendLoading} onPress={() => setBlendOverlayVisible(false)}>
                  <Text style={[styles.clearText, { color: colors.text }]}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.summaryBox, { backgroundColor: colors.panelAlt }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Matched travelers</Text>
                <Text style={[styles.copy, { color: colors.textMuted }]}>You � {profile?.destination || "Flexible"} � {profile?.budget || "Balanced"} � {profile?.travelStyle || "Flexible"}</Text>
                {focusedMatches.map((buddy) => (
                  <Text key={buddy.id} style={[styles.copy, { color: colors.textMuted }]}>
                    {buddy.name} � {buddy.destination || "Flexible"} � {buddy.budget || "Flexible"} � {buddy.travelStyle || "Flexible"}
                  </Text>
                ))}
              </View>

              {blendLoading ? (
                <Text style={[styles.copy, { color: colors.textMuted }]}>Analyzing traveler data for the requested blend...</Text>
              ) : blendResult ? (
                <View style={[styles.resultBox, { backgroundColor: colors.panelAlt }]}>
                  <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.resultText, { color: colors.textMuted }]}>{blendResult}</Text>
                  </ScrollView>
                </View>
              ) : blendError ? (
                <Text style={[styles.errorText, { color: colors.coral }]}>{blendError}</Text>
              ) : (
                <Text style={[styles.copy, { color: colors.textMuted }]}>Tap Blend DNA to generate the match summary.</Text>
              )}

              <TouchableOpacity onPress={handleBlend} disabled={blendLoading}>
                <LinearGradient colors={gradients.accent} style={styles.refreshButton}>
                  <Text style={[styles.blendMainText, { color: colors.text }]}>{blendLoading ? "Refreshing..." : "Refresh summary"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  screenBody: { flex: 1 },
  scrollBody: { gap: 16, paddingBottom: 140 },
  headerTitle: { fontWeight: "900", fontSize: 16 },
  headerMeta: { fontSize: 12, fontWeight: "700" },
  feedBlock: { gap: 14 },
  idCard: { flexDirection: "row", gap: 12 },
  nameText: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  copy: { lineHeight: 20 },
  idMeta: { alignItems: "flex-end", gap: 6, maxWidth: 110 },
  matchBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 72,
  },
  matchBadgeValue: { fontSize: 18, fontWeight: "900" },
  matchBadgeLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  metaText: { fontSize: 12, fontWeight: "700", textAlign: "right" },
  metaTag: { fontSize: 12, fontWeight: "800" },
  imageCard: { width: "100%", height: 420, borderRadius: 28 },
  promptQ: { fontWeight: "800", fontSize: 15 },
  promptA: { lineHeight: 22, marginTop: 8 },
  sectionTitle: { fontWeight: "800", fontSize: 16 },
  snapshotRow: { gap: 12, marginTop: 10 },
  fitBox: { alignSelf: "flex-start", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  fitValue: { fontSize: 22, fontWeight: "900" },
  fitLabel: { fontSize: 11, fontWeight: "800" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  tagText: { fontWeight: "700", fontSize: 12 },
  quizWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quizOption: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  quizText: { fontWeight: "800" },
  quizResult: { fontWeight: "800", lineHeight: 20 },
  noteList: { gap: 10 },
  noteCard: { borderRadius: 18, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  noteTitle: { fontWeight: "800" },
  clearButton: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, alignSelf: "flex-start" },
  clearText: { fontWeight: "800" },
  modeRow: { flexDirection: "row", gap: 10 },
  modeButton: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  modeText: { fontWeight: "900" },
  preferenceBlock: { gap: 8, marginTop: 12 },
  preferenceLabel: { fontWeight: "800", fontSize: 13 },
  preferenceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preferenceChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  preferenceChipText: { fontWeight: "800", fontSize: 12 },
  floatingDock: {
    position: "absolute",
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: { width: 50, height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  iconText: { fontWeight: "900" },
  blendWrap: { flex: 1 },
  blendMain: { minHeight: 54, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  blendMainText: { fontWeight: "900" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", alignItems: "center", padding: 18 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  zoomImage: { width: "92%", height: 520, borderRadius: 28 },
  blendSheet: { width: "100%", height: "86%", borderRadius: 26, padding: 0, overflow: "hidden" },
  blendSheetContent: { flex: 1, padding: 18, gap: 14 },
  sheetTitle: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  summaryBox: { borderRadius: 18, padding: 14, gap: 8 },
  resultBox: { borderRadius: 18, padding: 14, maxHeight: 260 },
  resultScroll: { maxHeight: 220 },
  resultText: { lineHeight: 22 },
  errorText: { lineHeight: 21, fontWeight: "700" },
  refreshButton: { minHeight: 52, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  loadMoreButton: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center" },
  loadMoreText: { fontWeight: "800" },
});


