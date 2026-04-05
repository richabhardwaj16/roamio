import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { backendApi } from "../../src/services/backend";

export default function Settings() {
  const { profile, notifications, clearCommunityChat, updateProfileDetails } = useAppData();
  const { logout } = useAuth();
  const { mode, toggleMode, resetStateTheme, selectedState, theme } = useTheme();
  const { colors } = theme;
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    liveMap: true,
    notifications: true,
    quizzes: true,
    publicProfile: false,
  });

  return (
    <Screen title="Settings" subtitle="Customize your experience.">
      <Panel>
        <Eyebrow>Status</Eyebrow>
        <Text style={[styles.title, { color: colors.text }]}>App Controls</Text>
        <Text style={[styles.copy, { color: colors.textMuted }]}>Backend base URL: {backendApi.baseUrl}</Text>
        <Text style={[styles.copy, { color: colors.textMuted }]}>
          {notifications.length} active notifications • SOS contact {profile.sosContact}
        </Text>
        <Text style={[styles.copy, { color: colors.textMuted }]}>
          Active state theme: {selectedState || "Default sunrise"}
        </Text>
      </Panel>

      <Panel>
        <Eyebrow>Appearance</Eyebrow>
        <View style={[styles.toggleRow, { backgroundColor: colors.panelAlt, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Appearance</Text>
            <Text style={[styles.rowCopy, { color: colors.textMuted }]}>Switch between light and dark mode.</Text>
          </View>
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.bgSoft }]} onPress={toggleMode}>
            <Text style={[styles.secondaryText, { color: colors.text }]}>
              {mode === "light" ? "Light mode" : "Dark mode"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.toggleRow, { backgroundColor: colors.panelAlt, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Default app theme</Text>
            <Text style={[styles.rowCopy, { color: colors.textMuted }]}>
              Restore the default palette and clear map-based state styling.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.bgSoft }]}
            onPress={() => {
              resetStateTheme();
              Alert.alert("Default palette restored", "Base theme set back to the default Roamio palette.");
            }}
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>Set default</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(toggles).map(([key, value]) => (
          <View key={key} style={[styles.toggleRow, { backgroundColor: colors.panelAlt, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text, textTransform: "capitalize" }]}>{key}</Text>
              <Text style={[styles.rowCopy, { color: colors.textMuted }]}>Toggle {key} for your Roamio experience.</Text>
            </View>
            <Switch
              value={Boolean(value)}
              onValueChange={() => setToggles((current) => ({ ...current, [key]: !Boolean(current[key]) }))}
              thumbColor={value ? colors.teal : "#ffffff"}
              trackColor={{ false: "rgba(255,255,255,0.18)", true: "rgba(25,196,182,0.38)" }}
            />
          </View>
        ))}
      </Panel>

      <Panel>
        <Eyebrow>Safety and Notifications</Eyebrow>
        <View style={styles.infoGrid}>
          <View style={[styles.infoBox, { backgroundColor: colors.panelAlt }]}>
            <Text style={[styles.infoLabel, { color: colors.textDim }]}>Current SOS contact</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{profile.sosContact}</Text>
          </View>
          <View style={[styles.infoBox, { backgroundColor: colors.panelAlt }]}>
            <Text style={[styles.infoLabel, { color: colors.textDim }]}>Active notifications</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{notifications.length}</Text>
          </View>
        </View>

        {(profile.emergencyContacts || []).slice(0, 3).map((contact, index) => (
          <View key={contact.id || index} style={[styles.contactRow, { backgroundColor: colors.panelAlt }]}>
            <View style={[styles.contactDot, { backgroundColor: colors.bgSoft }]}>
              <Text style={[styles.contactDotText, { color: colors.teal }]}>{contact.name?.[0] || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{contact.name || "Add Contact"}</Text>
              <Text style={[styles.rowCopy, { color: colors.textMuted }]}>{contact.phone || "No number saved"}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.panelAlt }]}
          onPress={async () => {
            await updateProfileDetails({ sosContact: "112 / trusted contact" });
            Alert.alert("SOS contact updated", "Your default safety contact has been refreshed.");
          }}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Set default SOS contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.panelAlt }]}
          onPress={async () => {
            await clearCommunityChat();
            Alert.alert("Community chat cleared", "The shared mobile chat room was reset.");
          }}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Clear community chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.panelAlt }]} onPress={() => router.push("/(tabs)/security")}>
          <Text style={[styles.actionText, { color: colors.text }]}>Open safety center</Text>
        </TouchableOpacity>
      </Panel>

      <Panel>
        <Eyebrow>Session</Eyebrow>
        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  copy: {
    lineHeight: 21,
  },
  toggleRow: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  rowTitle: {
    fontWeight: "800",
  },
  rowCopy: {
    marginTop: 4,
  },
  secondaryButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryText: {
    fontWeight: "800",
  },
  infoGrid: {
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
  contactRow: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  contactDotText: {
    fontWeight: "900",
  },
  actionButton: {
    borderRadius: 18,
    padding: 16,
  },
  actionText: {
    fontWeight: "800",
  },
  logoutButton: {
    backgroundColor: "rgba(255,109,94,0.14)",
  },
  logoutText: {
    color: "#ff6d5e",
    fontWeight: "900",
  },
});
