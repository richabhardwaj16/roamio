import { PropsWithChildren, ReactNode, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../contexts/AppDataContext";
import { useTheme } from "../contexts/ThemeContext";

type ScreenProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  scroll?: boolean;
  showMenu?: boolean;
  children?: ReactNode;
};

const MENU_LINKS = [
  { href: "/(tabs)/home", label: "Home", short: "01" },
  { href: "/(tabs)/arena", label: "Arena", short: "02" },
  { href: "/(tabs)/explore", label: "Explore", short: "03" },
  { href: "/(tabs)/friends", label: "Friends", short: "04" },
  { href: "/(tabs)/blends", label: "Blends", short: "05" },
  { href: "/(tabs)/chat", label: "Chat", short: "06" },
  { href: "/(tabs)/profile", label: "Profile", short: "07" },
  { href: "/(tabs)/security", label: "Security", short: "08" },
  { href: "/(tabs)/settings", label: "Settings", short: "09" },
];

export function Screen({ title, subtitle, action, children, scroll = true, showMenu = true }: ScreenProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifications, profile } = useAppData();
  const { theme } = useTheme();
  const { colors, gradients } = theme;
  const firstName = useMemo(() => profile.name?.split(" ")[0] || "Traveler", [profile.name]);

  const content = (
    <View style={styles.inner}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showMenu ? (
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
              <View style={[styles.menuLine, { backgroundColor: colors.text }]} />
              <View style={[styles.menuLine, { backgroundColor: colors.text }]} />
              <View style={[styles.menuLine, { backgroundColor: colors.text }]} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.contextChip, { backgroundColor: colors.panelAlt, borderColor: colors.border }]}>
            <Text style={[styles.contextChipValue, { color: colors.text }]}>{notifications.length}</Text>
            <Text style={[styles.contextChipLabel, { color: colors.textDim }]}>alerts</Text>
          </View>
          <View style={[styles.contextChip, { backgroundColor: colors.panelAlt, borderColor: colors.border }]}>
            <Text style={[styles.contextChipValue, { color: colors.text }]}>{profile.level}</Text>
            <Text style={[styles.contextChipLabel, { color: colors.textDim }]}>{firstName}</Text>
          </View>
          {action}
        </View>
      </View>
      {children}
      {showMenu ? (
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
            <View style={[styles.drawer, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}>
              <View style={styles.drawerHeader}>
                <View>
                  <Text style={[styles.drawerBrand, { color: colors.text }]}>Roamio</Text>
                  <Text style={[styles.drawerTagline, { color: colors.textMuted }]}>Your Trip, Your Vibe</Text>
                </View>
                <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.panelAlt }]} onPress={() => setMenuOpen(false)}>
                  <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerNav}>
                {MENU_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <TouchableOpacity
                      key={link.href}
                      style={[
                        styles.drawerLink,
                        { backgroundColor: colors.panelAlt, borderColor: colors.border },
                        active && [styles.drawerLinkActive, { borderColor: colors.teal, backgroundColor: colors.panelAlt }],
                      ]}
                      onPress={() => {
                        setMenuOpen(false);
                        router.push(link.href as never);
                      }}
                    >
                      <Text style={[styles.drawerLinkIndex, { color: active ? colors.teal : colors.textDim }]}>{link.short}</Text>
                      <Text style={[styles.drawerLinkLabel, { color: active ? colors.teal : colors.text }]}>{link.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.drawerFooter, { backgroundColor: colors.panelAlt }]}>
                <Text style={[styles.drawerFooterTitle, { color: colors.text }]}>Travel Safe</Text>
                <Text style={[styles.drawerFooterCopy, { color: colors.textMuted }]}>
                  Roamio is your mobile dashboard for planning, matching, AI help, safety, memories, and chat.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );

  return (
    <LinearGradient colors={gradients.screen} style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Panel({ children }: PropsWithChildren<object>) {
  const { theme } = useTheme();
  const { colors } = theme;
  return <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border, shadowColor: colors.shadow }]}>{children}</View>;
}

export function Eyebrow({ children }: PropsWithChildren<object>) {
  const { theme } = useTheme();
  return <Text style={[styles.eyebrow, { color: theme.colors.teal }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 18,
    gap: 16,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 5,
    borderWidth: 1,
  },
  menuLine: {
    height: 2.5,
    borderRadius: 999,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  contextChip: {
    minWidth: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  contextChipValue: {
    fontSize: 12,
    fontWeight: "900",
  },
  contextChipLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 11,
    fontWeight: "800",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 10, 18, 0.4)",
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: 292,
    borderLeftWidth: 1,
    paddingTop: 60,
    paddingHorizontal: 18,
    gap: 16,
  },
  drawerHeader: {
    gap: 10,
  },
  drawerBrand: {
    fontSize: 28,
    fontWeight: "900",
  },
  drawerTagline: {
    marginTop: 4,
  },
  closeButton: {
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  closeButtonText: {
    fontWeight: "800",
  },
  drawerNav: {
    gap: 10,
  },
  drawerLink: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  drawerLinkActive: {
  },
  drawerLinkIndex: {
    fontWeight: "900",
    minWidth: 24,
  },
  drawerLinkLabel: {
    fontWeight: "800",
    fontSize: 15,
  },
  drawerFooter: {
    marginTop: 6,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  drawerFooterTitle: {
    fontWeight: "800",
  },
  drawerFooterCopy: {
    lineHeight: 20,
  },
});
