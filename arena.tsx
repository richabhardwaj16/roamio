import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { backendApi } from "../../src/services/backend";
import { palette } from "../../src/theme/palette";

const LEVELS = [
  { level: "Explorer", minXp: 0 },
  { level: "Wanderer", minXp: 100 },
  { level: "Nomad", minXp: 300 },
  { level: "Trailblazer", minXp: 700 },
  { level: "Legend", minXp: 1500 },
];

function getProgress(xp: number) {
  const current = [...LEVELS].reverse().find((item) => xp >= item.minXp) || LEVELS[0];
  const next = LEVELS.find((item) => item.minXp > xp);
  if (!next) {
    return { current, next: null, progress: 1 };
  }

  const span = next.minXp - current.minXp;
  const progress = span <= 0 ? 1 : (xp - current.minXp) / span;
  return { current, next, progress: Math.max(0, Math.min(1, progress)) };
}

export default function Arena() {
  const { profile } = useAppData();
  const { token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<
    { id: string; name: string; xp: number; level: string; badges: string[]; streak: number; rank: number }[]
  >([]);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [xpToast, setXpToast] = useState("");
  const [badgeToast, setBadgeToast] = useState("");
  const previousXp = useRef(profile.xp);
  const previousBadges = useRef(profile.badges);
  const xpAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const progress = useMemo(() => getProgress(profile.xp), [profile.xp]);

  useEffect(() => {
    async function loadLeaderboard() {
      if (!token) return;
      try {
        const response = await backendApi.getGamificationLeaderboard(token);
        setLeaderboard(response.leaderboard);
        setCurrentRank(response.currentUserRank);
      } catch {
        setLeaderboard([]);
      }
    }

    loadLeaderboard();
  }, [token, profile.xp]);

  useEffect(() => {
    const gained = profile.xp - previousXp.current;
    if (gained > 0) {
      setXpToast(`+${gained} XP`);
      xpAnim.setValue(0);
      Animated.sequence([
        Animated.timing(xpAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(xpAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
    previousXp.current = profile.xp;
  }, [profile.xp, xpAnim]);

  useEffect(() => {
    const newBadges = profile.badges.filter((badge) => !previousBadges.current.includes(badge));
    if (newBadges.length > 0) {
      setBadgeToast(`Badge unlocked: ${newBadges[0]}`);
      badgeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(badgeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(badgeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
    previousBadges.current = profile.badges;
  }, [badgeAnim, profile.badges]);

  return (
    <Screen title="Travel Arena" subtitle="Share. Compete. Shine.">
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            opacity: xpAnim,
            transform: [{ translateY: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          },
        ]}
      >
        <Text style={styles.toastText}>{xpToast}</Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.badgeToast,
          {
            opacity: badgeAnim,
            transform: [{ scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
          },
        ]}
      >
        <Text style={styles.toastText}>{badgeToast}</Text>
      </Animated.View>

      <Panel>
        <Eyebrow>Your Standing</Eyebrow>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rank}>#{currentRank || "-"}</Text>
            <Text style={styles.copy}>{profile.level} • {profile.xp} XP</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{profile.level}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress.progress * 100}%` }]} />
        </View>
        <Text style={styles.copy}>
          {progress.next ? `${progress.next.minXp - profile.xp} XP to ${progress.next.level}` : "Max level reached"}
        </Text>
      </Panel>

      <Panel>
        <Eyebrow>Daily Missions</Eyebrow>
        {profile.dailyMissions.length === 0 ? (
          <Text style={styles.copy}>No missions loaded yet.</Text>
        ) : (
          profile.dailyMissions.map((mission) => {
            const percent = mission.target > 0 ? (mission.progress / mission.target) * 100 : 0;
            return (
              <View key={mission.id} style={styles.missionCard}>
                <View style={styles.headerRow}>
                  <Text style={styles.rowTitle}>{mission.title}</Text>
                  <Text style={styles.rowMeta}>{mission.rewardXp} XP</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, percent)}%` }]} />
                </View>
                <Text style={styles.copy}>
                  {mission.progress}/{mission.target} {mission.completed ? "• Completed" : ""}
                </Text>
              </View>
            );
          })
        )}
      </Panel>

      <Panel>
        <Eyebrow>Streak</Eyebrow>
        <Text style={styles.rank}>{profile.streak} day{profile.streak === 1 ? "" : "s"}</Text>
        <Text style={styles.copy}>Bonus XP milestones unlock at 3, 7, and 14 days.</Text>
      </Panel>

      <Panel>
        <Eyebrow>Badges</Eyebrow>
        {profile.badges.length === 0 ? (
          <Text style={styles.copy}>No badges unlocked yet.</Text>
        ) : (
          <View style={styles.badgesWrap}>
            {profile.badges.map((badge) => (
              <View key={badge} style={styles.badgeChip}>
                <Text style={styles.badgeChipText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}
      </Panel>

      <Panel>
        <Eyebrow>Top Travelers</Eyebrow>
        {leaderboard.length === 0 ? (
          <Text style={styles.copy}>Leaderboard is loading.</Text>
        ) : (
          leaderboard.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>#{item.rank} {item.name}</Text>
                <Text style={styles.rowMeta}>{item.level} • {item.streak} day streak</Text>
              </View>
              <Text style={styles.rowMeta}>{item.xp} XP</Text>
            </View>
          ))
        )}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignSelf: "center",
    backgroundColor: "rgba(25,196,182,0.16)",
    borderColor: "rgba(25,196,182,0.4)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeToast: {
    alignSelf: "center",
    backgroundColor: "rgba(243,185,79,0.16)",
    borderColor: "rgba(243,185,79,0.4)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: {
    color: palette.text,
    fontWeight: "800",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rank: {
    color: palette.text,
    fontSize: 30,
    fontWeight: "900",
  },
  copy: {
    color: palette.textMuted,
    lineHeight: 20,
  },
  levelBadge: {
    backgroundColor: "rgba(25,196,182,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelBadgeText: {
    color: palette.teal,
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.panelAlt,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.teal,
  },
  missionCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeChip: {
    backgroundColor: palette.panelAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeChipText: {
    color: palette.text,
    fontWeight: "800",
  },
  row: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: {
    color: palette.text,
    fontWeight: "800",
  },
  rowMeta: {
    color: palette.textMuted,
  },
});
