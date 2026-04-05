import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import Svg, { Line, Polygon } from "react-native-svg";
import { Panel, Eyebrow } from "./Screen";
import { PublicProfile } from "../contexts/AppDataContext";
import { palette } from "../theme/palette";

const GRAPH_SIZE = 88;
const CENTER = GRAPH_SIZE / 2;
const RADIUS = GRAPH_SIZE / 2 - 10;

function point(value: number, index: number) {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * RADIUS * value,
    y: CENTER + Math.sin(angle) * RADIUS * value,
  };
}

function buildPolygon(profile: PublicProfile) {
  const values = [
    profile.travelerDNA.socialPreference ?? 0.5,
    profile.travelerDNA.budgetStyle ?? 0.5,
    1 - (profile.travelerDNA.planningStyle ?? 0.5),
    profile.interests.includes("food") || profile.interests.includes("Foodie Traveler") ? 0.9 : 0.6,
    profile.travelerDNA.energyLevel ?? 0.5,
  ];

  return values.map((value, index) => {
    const next = point(value, index);
    return `${next.x},${next.y}`;
  }).join(" ");
}

function fit(profile: PublicProfile) {
  const values = Object.values(profile.travelerDNA || {});
  const total = values.reduce((sum, value) => sum + (value || 0.5), 0);
  return Math.round((total / Math.max(values.length, 1)) * 100);
}

export function ProfileFeedCard({
  profile,
  onImagePress,
  onPress,
}: {
  profile: PublicProfile;
  onImagePress?: (image: string) => void;
  onPress?: () => void;
}) {
  const heroImage = profile.photo || profile.photos.find(Boolean) || "";
  const polygon = buildPolygon(profile);

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Panel>
      <View style={styles.topline}>
        <View style={{ flex: 1 }}>
          <Eyebrow>Now Exploring</Eyebrow>
          <Text style={styles.name}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
          <Text style={styles.copy}>{profile.bio}</Text>
        </View>
        <View style={styles.meta}>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{profile.matchScore ?? fit(profile)}%</Text>
            <Text style={styles.matchBadgeLabel}>MATCH</Text>
          </View>
          <Text style={styles.metaText}>{profile.hometown || profile.city}</Text>
          <Text style={styles.metaAccent}>{profile.level}</Text>
        </View>
      </View>

      {heroImage ? (
        <Pressable onPress={() => onImagePress?.(heroImage)}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
        </Pressable>
      ) : null}

      <View style={styles.snapshot}>
        <View style={{ flex: 1, gap: 8 }}>
          <Eyebrow>Travel Snapshot</Eyebrow>
          <Text style={styles.snapshotText}>
            Destination fit is strongest around {profile.destination}, with a {profile.travelStyle.toLowerCase()} pace and {profile.budget.toLowerCase()} budget.
          </Text>
          <Text style={styles.score}>{fit(profile)}% FIT</Text>
          <View style={styles.tags}>
            {profile.interests.slice(0, 4).map((item) => (
              <View key={item} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
          {Array.from({ length: 5 }).map((_, index) => {
            const next = point(1, index);
            return (
              <Line
                key={`axis-${index}`}
                x1={CENTER}
                y1={CENTER}
                x2={next.x}
                y2={next.y}
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1}
              />
            );
          })}
          <Polygon points={polygon} fill="rgba(25,196,182,0.35)" stroke={palette.teal} strokeWidth={2} />
        </Svg>
      </View>

      {profile.prompts.filter((item) => item.question).slice(0, 2).map((prompt, index) => (
        <View key={`${prompt.question}-${index}`} style={styles.promptCard}>
          <Text style={styles.promptQuestion}>{prompt.question}</Text>
          <Text style={styles.promptAnswer}>{prompt.answer || "..."}</Text>
        </View>
      ))}
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topline: {
    flexDirection: "row",
    gap: 12,
  },
  name: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800",
  },
  copy: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    alignItems: "flex-end",
    gap: 6,
  },
  matchBadge: {
    backgroundColor: "rgba(25,196,182,0.16)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 70,
  },
  matchBadgeText: {
    color: palette.teal,
    fontSize: 18,
    fontWeight: "900",
  },
  matchBadgeLabel: {
    color: palette.textDim,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  metaText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  metaAccent: {
    color: palette.teal,
    fontSize: 12,
    fontWeight: "800",
  },
  heroImage: {
    width: "100%",
    height: 320,
    borderRadius: 22,
    backgroundColor: palette.panelAlt,
  },
  snapshot: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  snapshotText: {
    color: palette.text,
    lineHeight: 20,
    fontSize: 14,
  },
  score: {
    color: palette.teal,
    fontSize: 20,
    fontWeight: "900",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  promptCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: palette.teal,
  },
  promptQuestion: {
    color: palette.teal,
    fontSize: 12,
    fontWeight: "800",
  },
  promptAnswer: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
});
