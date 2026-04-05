import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { palette } from "../../src/theme/palette";

function buildXpSeed(value = "") {
  return Array.from(String(value)).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildDisplayXp(id: string, name: string) {
  const seed = buildXpSeed(`${id}-${name}`);
  const daily = 50 * ((seed % 5) + 1);
  const blend = 200 * ((seed % 3) + 1);
  const streak = seed % 2 === 0 ? 500 : 0;
  return daily + blend + streak;
}

export default function Friends() {
  const { buddies, loading } = useAppData();
  const [showXpInfo, setShowXpInfo] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");

  const enrichedBuddies = useMemo(
    () =>
      buddies.map((buddy) => ({
        ...buddy,
        displayXP: buildDisplayXp(buddy.id, buddy.name),
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

  const validMatches = filteredBuddies.slice(0, 4);
  const pendingUsers = filteredBuddies.slice(4, 10);

  return (
    <Screen title="Blended Souls" subtitle="Travel better together">
      <Panel>
        <View style={styles.headerRow}>
          <View>
            <Eyebrow>Friends</Eyebrow>
            <Text style={styles.title}>Match Hub</Text>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={() => setShowXpInfo((current) => !current)}>
            <Text style={styles.infoButtonText}>{showXpInfo ? "Hide XP" : "XP Info"}</Text>
          </TouchableOpacity>
        </View>

        {showXpInfo ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Travel DNA Blueprint</Text>
            <Text style={styles.infoLine}>Daily app check-in: +50 XP</Text>
            <Text style={styles.infoLine}>Successful blend match: +200 XP</Text>
            <Text style={styles.infoLine}>3-day travel streak: +500 XP</Text>
            <Text style={styles.infoFoot}>Higher XP unlocks stronger badges and more visible match energy.</Text>
          </View>
        ) : null}
      </Panel>

      <Panel>
        <Eyebrow>Search</Eyebrow>
        <TextInput
          style={styles.input}
          placeholder="Search username or name"
          placeholderTextColor={palette.textDim}
          value={searchUsername}
          onChangeText={setSearchUsername}
        />
      </Panel>

      <Panel>
        <Eyebrow>Pending Blends ({pendingUsers.length})</Eyebrow>
        {loading ? <Text style={styles.empty}>Loading travel matches...</Text> : null}
        {!loading && pendingUsers.length === 0 ? (
          <Text style={styles.empty}>
            {searchUsername.trim()
              ? "No pending users matched that search."
              : "More pending blends will appear as new public profiles join."}
          </Text>
        ) : null}
        {pendingUsers.map((buddy) => (
          <View key={`pending-${buddy.id}`} style={styles.pendingCard}>
            <View style={styles.pendingAvatar}>
              <Text style={styles.pendingAvatarText}>{buddy.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{buddy.name}</Text>
              <Text style={styles.meta}>@{buddy.username || buddy.name.toLowerCase().replace(/\s+/g, "")}</Text>
            </View>
            <Text style={styles.timerBadge}>21h</Text>
          </View>
        ))}
      </Panel>

      <Panel>
        <Eyebrow>Mutual Matches ({validMatches.length})</Eyebrow>
        {!loading && validMatches.length === 0 ? (
          <Text style={styles.empty}>
            {searchUsername.trim()
              ? "No users matched that username yet."
              : "No mutual matches yet. Ask another traveler to complete their profile."}
          </Text>
        ) : null}
        {validMatches.map((buddy) => (
          <View key={buddy.id} style={styles.card}>
            <View style={styles.matchAvatar}>
              <Text style={styles.matchAvatarText}>{buddy.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{buddy.name}</Text>
              <Text style={styles.meta}>@{buddy.username || buddy.name.toLowerCase().replace(/\s+/g, "")}</Text>
              <Text style={styles.meta}>{buddy.displayXP} XP • 3 day streak</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({ pathname: "/traveler/[id]", params: { id: buddy.id } })}
                >
                  <Text style={styles.actionText}>View profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => router.push({ pathname: "/(tabs)/chat", params: { thread: `direct:${buddy.id}` } })}
                >
                  <Text style={[styles.actionText, styles.primaryActionText]}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{buddy.matchScore}%</Text>
            </View>
          </View>
        ))}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
  },
  infoButton: {
    backgroundColor: palette.panelAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoButtonText: {
    color: palette.teal,
    fontWeight: "800",
  },
  infoCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  infoTitle: {
    color: palette.text,
    fontWeight: "800",
  },
  infoLine: {
    color: palette.textMuted,
  },
  infoFoot: {
    color: palette.textDim,
    fontSize: 12,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: palette.panelAlt,
    color: palette.text,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  empty: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  pendingCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(25,196,182,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingAvatarText: {
    color: palette.teal,
    fontWeight: "900",
  },
  timerBadge: {
    color: palette.teal,
    fontWeight: "900",
    fontSize: 12,
  },
  card: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  matchAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(57,167,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  matchAvatarText: {
    color: palette.cyan,
    fontWeight: "900",
  },
  name: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "800",
  },
  meta: {
    color: palette.textMuted,
    marginTop: 4,
    fontSize: 13,
  },
  badge: {
    minWidth: 58,
    borderRadius: 999,
    backgroundColor: "rgba(25,196,182,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  badgeText: {
    color: palette.teal,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryAction: {
    backgroundColor: palette.teal,
  },
  actionText: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 12,
  },
  primaryActionText: {
    color: palette.bg,
  },
});
