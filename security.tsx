import { useEffect, useState } from "react";
import { Alert, Linking, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";
import { push, ref, set } from "firebase/database";
import { Screen, Panel, Eyebrow } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { realtimeDb } from "../../src/firebase/firebase";
import { palette } from "../../src/theme/palette";

export default function Security() {
  const { profile, updateProfileDetails, triggerSosAlert } = useAppData();
  const { user } = useAuth();
  const activeContacts = (profile.emergencyContacts || []).filter((contact) => contact.active);
  const [sosOpen, setSosOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [shareLive, setShareLive] = useState(true);
  const [liveTimer, setLiveTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (liveTimer) {
        clearInterval(liveTimer);
      }
    };
  }, [liveTimer]);

  function buildMapLink(latitude: number, longitude: number) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission denied. Enable location access to share SOS.");
    }

    const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      latitude: coords.coords.latitude,
      longitude: coords.coords.longitude,
    };
  }

  async function startLiveShare() {
    if (!user?._id) return;
    let count = 0;
    const updatesRef = ref(realtimeDb, `mobileUsers/${user._id}/sos/updates`);

    const timer = setInterval(async () => {
      if (count >= 10) {
        clearInterval(timer);
        setLiveTimer(null);
        return;
      }
      count += 1;
      try {
        const coords = await getLocation();
        const payload = {
          ...coords,
          mapLink: buildMapLink(coords.latitude, coords.longitude),
          createdAt: Date.now(),
        };
        await push(updatesRef, payload);
        await set(ref(realtimeDb, `mobileUsers/${user._id}/sos/current`), payload);
      } catch {
        // Ignore transient location errors during live share.
      }
    }, 30000);

    setLiveTimer(timer);
  }

  async function pickContact(index: number) {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Allow contact access to add emergency contacts.");
      return;
    }

    const contact = await Contacts.presentContactPickerAsync();
    if (!contact) return;

    const nextContacts = [...profile.emergencyContacts];
    nextContacts[index] = {
      id: contact.id || String(index + 1),
      name: contact.name,
      phone: contact.phoneNumbers?.[0]?.number || "",
      active: true,
    };

    await updateProfileDetails({
      emergencyContacts: nextContacts,
      sosContact: nextContacts[index].phone || profile.sosContact,
    });

    if (user?._id) {
      try {
        await set(ref(realtimeDb, `mobileUsers/${user._id}/emergencyContacts/${nextContacts[index].id}`), {
          name: nextContacts[index].name,
          phone: nextContacts[index].phone,
          relation: "Contact",
          updatedAt: Date.now(),
        });
      } catch {
        // Keep local profile update even if Firebase is unavailable.
      }
    }
  }

  async function handleSosConfirm() {
    setSending(true);
    setLocationError("");
    try {
      const coords = await getLocation();
      const link = buildMapLink(coords.latitude, coords.longitude);
      setMapLink(link);

      if (user?._id) {
        const payload = {
          ...coords,
          mapLink: link,
          createdAt: Date.now(),
        };
        await set(ref(realtimeDb, `mobileUsers/${user._id}/sos/current`), payload);
        await push(ref(realtimeDb, `mobileUsers/${user._id}/sos/events`), payload);
      }

      await triggerSosAlert();
      if (shareLive) {
        await startLiveShare();
      }

      Alert.alert("SOS ready", `Alert prepared for ${activeContacts.length || 1} emergency contact(s).`);
      setSosOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to access location.";
      setLocationError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen title="Safety Center" subtitle="Safe journeys matter.">
      <Panel>
        <Eyebrow>SOS</Eyebrow>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setSosOpen(true)}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
        <Text style={styles.copy}>Tap to alert your emergency contacts with your active Roamio trip context.</Text>
      </Panel>

      <Panel>
        <View style={styles.panelHeader}>
          <View>
            <Eyebrow>Live Location Tracking</Eyebrow>
            <Text style={styles.sectionTitle}>Safety Map</Text>
          </View>
          <Text style={styles.liveBadge}>Live</Text>
        </View>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>{profile.city || profile.hometown || "Mumbai"}</Text>
          <Text style={styles.mapCopy}>Google Maps style live tracking can connect here later.</Text>
        </View>
      </Panel>

      <Panel>
        <View style={styles.panelHeader}>
          <View>
            <Eyebrow>Emergency Contacts</Eyebrow>
            <Text style={styles.sectionTitle}>Trusted Reach List</Text>
          </View>
          <Text style={styles.liveBadge}>{activeContacts.length}/5</Text>
        </View>

        {profile.emergencyContacts.map((contact, index) => (
          <TouchableOpacity key={contact.id || index} style={styles.contactCard} onPress={() => pickContact(index)}>
            <View style={[styles.contactIcon, contact.active && styles.contactIconActive]}>
              <Text style={[styles.contactIconText, contact.active && styles.contactIconTextActive]}>
                {contact.active ? "OK" : "+"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactName, !contact.active && styles.contactNameMuted]}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone || "Tap to choose a contact"}</Text>
            </View>
            <Text style={styles.contactAction}>{contact.active ? "Saved" : "Pick"}</Text>
          </TouchableOpacity>
        ))}
      </Panel>

      <Modal visible={sosOpen} transparent animationType="fade" onRequestClose={() => setSosOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Trigger SOS?</Text>
            <Text style={styles.modalCopy}>We will fetch your live location and prepare an emergency message.</Text>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Share live location</Text>
                <Text style={styles.toggleCopy}>Every 30s for 5 minutes.</Text>
              </View>
              <Switch value={shareLive} onValueChange={setShareLive} trackColor={{ true: palette.teal }} />
            </View>

            {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Message preview</Text>
              <Text style={styles.previewText}>
                I need help. My live location: {mapLink || "Location will appear here."}
              </Text>
            </View>

            <View style={styles.callRow}>
              <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL("tel:112")}>
                <Text style={styles.callText}>Call 112</Text>
              </TouchableOpacity>
              {activeContacts[0]?.phone ? (
                <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${activeContacts[0].phone}`)}>
                  <Text style={styles.callText}>Call {activeContacts[0].name}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleSosConfirm} disabled={sending}>
                <Text style={styles.confirmText}>{sending ? "Sending..." : "Confirm SOS"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSosOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#ff5f5f",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  sosText: {
    color: palette.text,
    fontSize: 36,
    fontWeight: "900",
  },
  copy: {
    color: palette.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: palette.panel,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "900",
  },
  modalCopy: {
    color: palette.textMuted,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTitle: {
    color: palette.text,
    fontWeight: "800",
  },
  toggleCopy: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: palette.coral,
    fontWeight: "700",
  },
  previewBox: {
    backgroundColor: palette.panelAlt,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  previewLabel: {
    color: palette.textDim,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "800",
  },
  previewText: {
    color: palette.text,
    lineHeight: 20,
  },
  callRow: {
    flexDirection: "row",
    gap: 10,
  },
  callButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    alignItems: "center",
  },
  callText: {
    color: palette.text,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#ff5f5f",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: {
    color: palette.text,
    fontWeight: "900",
  },
  cancelButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  cancelText: {
    color: palette.textMuted,
    fontWeight: "800",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800",
  },
  liveBadge: {
    color: palette.teal,
    fontWeight: "900",
    fontSize: 12,
  },
  mapPlaceholder: {
    backgroundColor: palette.panelAlt,
    borderRadius: 20,
    padding: 18,
    minHeight: 130,
    justifyContent: "center",
  },
  mapTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  mapCopy: {
    color: palette.textMuted,
    lineHeight: 21,
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  contactIconActive: {
    backgroundColor: "rgba(25,196,182,0.18)",
  },
  contactIconText: {
    color: palette.textDim,
    fontWeight: "900",
  },
  contactIconTextActive: {
    color: palette.teal,
  },
  contactName: {
    color: palette.text,
    fontWeight: "800",
  },
  contactNameMuted: {
    color: palette.textDim,
  },
  contactPhone: {
    color: palette.textMuted,
    marginTop: 4,
  },
  contactAction: {
    color: palette.teal,
    fontWeight: "900",
    fontSize: 12,
  },
});
