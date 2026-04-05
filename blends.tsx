import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { gradients, palette } from "../../src/theme/palette";

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

export default function Blends() {
  const { profile, buddies, trips, createBlend } = useAppData();
  const [mode, setMode] = useState<"duo" | "group">("group");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState(profile.destination);
  const [budget, setBudget] = useState(profile.budget);
  const [days, setDays] = useState("4");
  const [pace, setPace] = useState(profile.travelStyle || "Flexible");
  const myInterests = (profile.interests || []).map(normalizeTag);
  const myHobby = normalizeTag(profile.hobby || "");

  const suggestedMembers = [...buddies]
    .map((buddy) => {
      let score = buddy.matchScore || 0;
      if (buddy.destination === destination) score += 30;
      if (buddy.budget === budget) score += 24;
      if (buddy.travelStyle === pace) score += 20;

      const sharedInterests = (buddy.interests || [])
        .map(normalizeTag)
        .filter((item) => myInterests.includes(item)).length;
      const hobbyMatch = Boolean(myHobby && normalizeTag(buddy.hobby || "") === myHobby);

      score += sharedInterests * 16;
      if (hobbyMatch) score += 28;

      return { ...buddy, blendPreferenceScore: score, sharedInterests, hobbyMatch };
    })
    .sort((left, right) => right.blendPreferenceScore - left.blendPreferenceScore)
    .slice(0, mode === "duo" ? 1 : 3);

  async function handleCreate() {
    const chat = await createBlend(
      {
        title: title.trim() || `${destination} ${mode} blend`,
        destination,
        status: "Planning",
        budget,
        days: Number(days) || 4,
      },
      mode,
      { members: suggestedMembers }
    );

    if (chat) {
      router.push({ pathname: "/(tabs)/chat", params: { thread: chat.id } });
    }
  }

  return (
    <Screen title="Blends" subtitle="Where plans merge.">
      <Panel>
        <Eyebrow>Create Blend</Eyebrow>
        <View style={styles.modeRow}>
          {(["duo", "group"] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.modePill, mode === item && styles.modePillActive]}
              onPress={() => setMode(item)}
            >
              <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Blend title" placeholderTextColor={palette.textDim} />
        <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="Destination" placeholderTextColor={palette.textDim} />
        <TextInput style={styles.input} value={budget} onChangeText={setBudget} placeholder="Budget" placeholderTextColor={palette.textDim} />
        <TextInput style={styles.input} value={pace} onChangeText={setPace} placeholder="Trip pace / style" placeholderTextColor={palette.textDim} />
        <TextInput style={styles.input} value={days} onChangeText={setDays} placeholder="Days" keyboardType="numeric" placeholderTextColor={palette.textDim} />
        <TouchableOpacity onPress={handleCreate}>
          <LinearGradient colors={gradients.accent} style={styles.button}>
            <Text style={styles.buttonText}>Create blend</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Panel>

      <Panel>
        <Eyebrow>Suggested Members</Eyebrow>
        <Text style={styles.helperCopy}>Suggestions now follow your destination, budget, pace, shared interests, and hobby fit.</Text>
        {suggestedMembers.map((buddy) => (
          <TouchableOpacity
            key={buddy.id}
            style={styles.memberCard}
            onPress={() => router.push({ pathname: "/traveler/[id]", params: { id: buddy.id } })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{buddy.name}</Text>
              <Text style={styles.memberMeta}>{buddy.destination} • {buddy.budget}</Text>
              {buddy.sharedInterests > 0 || buddy.hobbyMatch ? (
                <Text style={styles.memberMeta}>
                  {buddy.sharedInterests > 0 ? `${buddy.sharedInterests} shared interest${buddy.sharedInterests > 1 ? "s" : ""}` : "Hobby match"}
                  {buddy.sharedInterests > 0 && buddy.hobbyMatch ? " • Hobby match" : ""}
                </Text>
              ) : null}
            </View>
            <Text style={styles.memberScore}>{buddy.blendPreferenceScore}%</Text>
          </TouchableOpacity>
        ))}
      </Panel>

      <Panel>
        <Eyebrow>Active Blends</Eyebrow>
        {trips.length === 0 ? (
          <Text style={styles.empty}>No mobile blends yet. Create the first one above.</Text>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => router.push({ pathname: "/(tabs)/chat", params: { thread: trip.chatId } })}
            >
              <Text style={styles.memberName}>{trip.title}</Text>
              <Text style={styles.memberMeta}>{trip.destination} • {trip.days} days • {trip.budget}</Text>
              <Text style={styles.memberMeta}>
                {(trip.members || []).length > 0 ? trip.members.map((member) => member.name).join(", ") : "Waiting for matches"}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.panelAlt,
  },
  modePillActive: {
    backgroundColor: "rgba(25,196,182,0.16)",
  },
  modeText: {
    color: palette.textMuted,
    fontWeight: "800",
  },
  modeTextActive: {
    color: palette.teal,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: palette.panelAlt,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    paddingHorizontal: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: palette.text,
    fontWeight: "900",
  },
  memberCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  tripCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  memberName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  memberMeta: {
    color: palette.textMuted,
    marginTop: 4,
  },
  memberScore: {
    color: palette.teal,
    fontWeight: "900",
  },
  empty: {
    color: palette.textMuted,
  },
  helperCopy: {
    color: palette.textMuted,
    lineHeight: 20,
  },
});
