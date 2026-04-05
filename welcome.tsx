import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "../../src/theme/palette";

export default function Welcome() {
  return (
    <ImageBackground source={require("../../assets/download.jpg")} style={styles.container} resizeMode="cover">
      <LinearGradient colors={["rgba(9,18,32,0.85)", "rgba(13,34,59,0.92)", "rgba(10,18,33,0.88)"]} style={styles.overlay}>
        <View pointerEvents="none" style={styles.orbTop} />
        <View pointerEvents="none" style={styles.orbBottom} />

        <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <LinearGradient colors={["rgba(57,167,255,0.35)", "rgba(25,196,182,0.12)"]} style={styles.logoGlow}>
            <Image source={require("../../assets/splash.png")} style={styles.logo} resizeMode="contain" />
          </LinearGradient>
        </View>
        <Text style={styles.eyebrow}>Roamio</Text>
        <Text style={styles.title}>Travel, simplified.</Text>
        <Text style={styles.copy}>Plan better routes, save places, and move lightly.</Text>

        <View style={styles.featureRow}>
          {["Routes", "AI Planner", "Blends"].map((item) => (
            <View key={item} style={styles.featureChip}>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

        <TouchableOpacity style={styles.primary} onPress={() => router.push("/(auth)/register")}>
        <LinearGradient colors={["#39a7ff", "#19c4b6"]} style={styles.primaryFill}>
          <Text style={styles.primaryText}>Create account</Text>
        </LinearGradient>
      </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.secondaryText}>Sign in</Text>
      </TouchableOpacity>

        <View style={styles.showcase}>
        <View style={styles.showcaseCard}>
          <Text style={styles.showcaseEyebrow}>travel safe</Text>
          <Text style={styles.showcaseCopy}>AI planning, map, chat, and matching in one calm space.</Text>
          <Text style={styles.showcaseSubcopy}>Keep essentials together and share plans with trusted travel buddies.</Text>
        </View>
      </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    paddingTop: 72,
    paddingBottom: 40,
  },
  orbTop: {
    position: "absolute",
    top: -120,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(57,167,255,0.12)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -160,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(25,196,182,0.12)",
  },
  hero: {
    gap: 12,
    alignItems: "flex-start",
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "rgba(25,196,182,0.3)",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  logoGlow: {
    width: 104,
    height: 104,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 88,
    height: 88,
  },
  eyebrow: {
    color: palette.teal,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "800",
  },
  title: {
    color: palette.text,
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 44,
  },
  copy: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  featureRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  featureChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureText: {
    color: palette.textMuted,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  primary: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 8,
  },
  primaryFill: {
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryText: {
    color: palette.text,
    fontWeight: "900",
    fontSize: 15,
  },
  secondary: {
    paddingVertical: 2,
    alignItems: "center",
    marginTop: -4,
  },
  secondaryText: {
    color: palette.teal,
    fontWeight: "800",
  },
  showcase: {
    marginTop: 18,
  },
  showcaseCard: {
    backgroundColor: "rgba(25,196,182,0.14)",
    borderRadius: 24,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  showcaseEyebrow: {
    color: palette.teal,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontWeight: "800",
    fontSize: 11,
  },
  showcaseCopy: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  showcaseSubcopy: {
    color: palette.textMuted,
    lineHeight: 21,
    fontSize: 13,
  },
});
