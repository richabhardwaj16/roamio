import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, Region } from "react-native-maps";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useTheme } from "../../src/contexts/ThemeContext";
import { askAI } from "../../src/services/ai";
import { useAppData } from "../../src/contexts/AppDataContext";

type Destination = ReturnType<typeof useAppData>["destinations"][number] & {
  latitude: number;
  longitude: number;
};

const INDIA_REGION: Region = {
  latitude: 22.5937,
  longitude: 78.9629,
  latitudeDelta: 18,
  longitudeDelta: 18,
};

function buildRegion(destination: Destination): Region {
  return {
    latitude: destination.latitude,
    longitude: destination.longitude,
    latitudeDelta: 2.2,
    longitudeDelta: 2.2,
  };
}

export default function Explore() {
  const { setSelectedState, theme } = useTheme();
  const { destinations, addReview } = useAppData();
  const { colors, gradients } = theme;
  const mapRef = useRef<MapView | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(destinations[0]?.id || "");
  const [prompt, setPrompt] = useState(
    destinations[0] ? `3-day ${destinations[0].name} trip with food, transport, and safety tips` : ""
  );
  const [plan, setPlan] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const mappedDestinations = useMemo<Destination[]>(
    () =>
      destinations.map((item) => ({
        ...item,
        latitude: item.lat,
        longitude: item.lon,
      })),
    [destinations]
  );

  const filteredDestinations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return mappedDestinations;

    return mappedDestinations.filter((item) =>
      [item.name, item.state, item.vibe, item.budget, item.description, ...item.tags].join(" ").toLowerCase().includes(normalized)
    );
  }, [mappedDestinations, query]);

  const selected =
    filteredDestinations.find((item) => item.id === selectedId) ||
    mappedDestinations.find((item) => item.id === selectedId) ||
    filteredDestinations[0] ||
    mappedDestinations[0];

  useEffect(() => {
    if (!selected) return;
    setSelectedState(selected.state);
    setPrompt((current) =>
      current.includes(selected.name) ? current : `3-day ${selected.name} trip with food, transport, and safety tips`
    );
  }, [selected, setSelectedState]);

  function focusDestination(destination: Destination) {
    setSelectedId(destination.id);
    mapRef.current?.animateToRegion(buildRegion(destination), 500);
  }

  async function generatePlan() {
    try {
      setLoading(true);
      const result = await askAI(
        `Create a practical itinerary for ${prompt}. Use ${selected.name}, ${selected.state} as the main destination. Include budget, local transport, stay suggestions, safety notes, and food.`
      );
      setPlan(result);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!selected || !reviewText.trim()) return;
    await addReview({
      placeId: selected.id,
      rating: 5,
      text: reviewText.trim(),
    });
    setReviewText("");
  }

  if (!selected) {
    return <Screen title="Explore" subtitle="Destinations are loading." />;
  }

  return (
    <Screen title="Explore" subtitle="Search places, scan the map, and turn discoveries into plans in a mobile layout.">
      <Panel>
        <Eyebrow>Search</Eyebrow>
        <TextInput
          style={[styles.input, { backgroundColor: colors.panelAlt, color: colors.text, borderColor: colors.border }]}
          placeholder="Search destinations, vibes, or tags"
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.suggestionWrap}>
          {filteredDestinations.slice(0, 6).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.suggestionPill,
                { backgroundColor: colors.panelAlt, borderColor: colors.border },
                selected.id === item.id && [styles.suggestionPillActive, { borderColor: colors.teal, backgroundColor: colors.bgSoft }],
              ]}
              onPress={() => focusDestination(item)}
            >
              <Text style={[styles.suggestionText, { color: selected.id === item.id ? colors.teal : colors.textMuted }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Panel>

      <Panel>
        <View style={styles.panelHead}>
          <View>
            <Eyebrow>Live Travel Map</Eyebrow>
            <Text style={[styles.mapTitle, { color: colors.text }]}>India destination view</Text>
          </View>
          <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.panelAlt }]} onPress={() => mapRef.current?.animateToRegion(INDIA_REGION, 500)}>
            <Text style={[styles.resetText, { color: colors.teal }]}>Reset</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.mapShell, { borderColor: colors.border }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={buildRegion(selected)}
            showsCompass
            toolbarEnabled={false}
            userInterfaceStyle={theme.mapStyle}
          >
            {filteredDestinations.map((place) => (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                title={place.name}
                description={`${place.state} • ${place.vibe}`}
                pinColor={selected.id === place.id ? colors.teal : colors.coral}
                onPress={() => setSelectedId(place.id)}
              />
            ))}
          </MapView>
        </View>
      </Panel>

      <Panel>
        <Eyebrow>Selected Place</Eyebrow>
        <Text style={[styles.placeName, { color: colors.text }]}>
          {selected.name}, {selected.state}
        </Text>
        <Text style={[styles.placeCopy, { color: colors.textMuted }]}>{selected.description}</Text>
        <Text style={[styles.ratingText, { color: colors.teal }]}>
          Rating {selected.rating} • {selected.country}
        </Text>
        <View style={styles.infoRow}>
          <View style={[styles.infoBox, { backgroundColor: colors.panelAlt }]}>
            <Text style={[styles.infoLabel, { color: colors.textDim }]}>Vibe</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{selected.vibe}</Text>
          </View>
          <View style={[styles.infoBox, { backgroundColor: colors.panelAlt }]}>
            <Text style={[styles.infoLabel, { color: colors.textDim }]}>Budget</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{selected.budget}</Text>
          </View>
        </View>
        <View style={[styles.factBox, { backgroundColor: colors.panelAlt }]}>
          <Text style={[styles.factTitle, { color: colors.teal }]}>Random Fact</Text>
          <Text style={[styles.factCopy, { color: colors.textMuted }]}>{selected.fact}</Text>
        </View>
        <View style={styles.tagRow}>
          {selected.tags.map((tag) => (
            <View key={tag} style={[styles.tagPill, { backgroundColor: colors.bgSoft }]}>
              <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Panel>
        <Eyebrow>Place Reviews</Eyebrow>
        {selected.reviews.length === 0 ? (
          <Text style={[styles.output, { color: colors.textMuted }]}>No reviews yet. Add the first one.</Text>
        ) : (
          <View style={styles.reviewStack}>
            {selected.reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.panelAlt }]}>
                <Text style={[styles.reviewAuthor, { color: colors.text }]}>{review.author}</Text>
                <Text style={[styles.reviewText, { color: colors.textMuted }]}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}
        <TextInput
          style={[styles.promptInput, { backgroundColor: colors.panelAlt, color: colors.text, borderColor: colors.border, minHeight: 96 }]}
          multiline
          placeholder={`Add a review for ${selected.name}`}
          placeholderTextColor={colors.textDim}
          value={reviewText}
          onChangeText={setReviewText}
        />
        <TouchableOpacity onPress={submitReview}>
          <LinearGradient colors={gradients.accent} style={styles.button}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Submit Review</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Panel>

      <Panel>
        <Eyebrow>AI Planner</Eyebrow>
        <TextInput
          style={[styles.promptInput, { backgroundColor: colors.panelAlt, color: colors.text, borderColor: colors.border }]}
          multiline
          placeholder="Describe the trip you want"
          placeholderTextColor={colors.textDim}
          value={prompt}
          onChangeText={setPrompt}
        />
        <TouchableOpacity onPress={generatePlan}>
          <LinearGradient colors={gradients.accent} style={styles.button}>
            <Text style={[styles.buttonText, { color: colors.text }]}>{loading ? "Planning..." : "Generate Plan"}</Text>
          </LinearGradient>
        </TouchableOpacity>
        {plan ? <Text style={[styles.output, { color: colors.textMuted }]}>{plan}</Text> : null}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  suggestionPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
  },
  suggestionPillActive: {},
  suggestionText: {
    fontWeight: "800",
  },
  panelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  resetButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resetText: {
    fontWeight: "800",
  },
  mapShell: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  map: {
    width: "100%",
    height: 300,
  },
  placeName: {
    fontSize: 22,
    fontWeight: "800",
  },
  placeCopy: {
    lineHeight: 22,
  },
  ratingText: {
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoBox: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  infoValue: {
    fontWeight: "800",
    marginTop: 6,
  },
  factBox: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  factTitle: {
    fontWeight: "800",
  },
  factCopy: {
    lineHeight: 21,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagText: {
    fontWeight: "700",
    fontSize: 12,
  },
  promptInput: {
    minHeight: 120,
    borderRadius: 18,
    padding: 16,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "900",
  },
  output: {
    lineHeight: 22,
  },
  reviewStack: {
    gap: 10,
  },
  reviewCard: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  reviewAuthor: {
    fontWeight: "800",
  },
  reviewText: {
    lineHeight: 21,
  },
});
