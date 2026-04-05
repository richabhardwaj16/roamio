import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, Panel } from "../../src/components/Screen";
import { useAppData } from "../../src/contexts/AppDataContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { palette } from "../../src/theme/palette";

export const options = {
  tabBarStyle: { display: "none" },
};

type ChatItem = {
  id: string;
  title: string;
  username: string;
  preview: string;
  timeLabel: string;
  timestamp: number;
  unreadCount: number;
  photo?: string;
};

function formatTimeLabel(timestamp?: number, fallback?: string) {
  if (!timestamp) return fallback || "";
  const now = Date.now();
  const diffDays = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(timestamp).toLocaleDateString([], { weekday: "long" });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "R";
}

export default function Chat() {
  const { user } = useAuth();
  const { directMessages, groupChat, blendChats, buddies, getProfileById, getDirectMessagesForUser } = useAppData();
  const currentProfileId = user?._id || "self";
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const conversations = useMemo<ChatItem[]>(() => {
    const threads = new Map<string, typeof directMessages>();

    const notesMessages = getDirectMessagesForUser("notes");
    const latestNotes = notesMessages[notesMessages.length - 1];
    const notesTimestamp = latestNotes?.createdAt || 0;
    const notesTimeLabel = formatTimeLabel(notesTimestamp, latestNotes?.time);

    directMessages.forEach((message) => {
      if (!message.toId || message.toId === "notes") return;
      const otherId = message.authorId === currentProfileId ? message.toId : message.authorId;
      if (!otherId) return;
      const list = threads.get(otherId) || [];
      list.push(message);
      threads.set(otherId, list);
    });

    const items = Array.from(threads.entries()).map(([otherId, messages]) => {
      const sorted = [...messages].sort((left, right) => (left.createdAt || 0) - (right.createdAt || 0));
      const last = sorted[sorted.length - 1];
      const profile = getProfileById(otherId);
      const title = profile?.name || last?.toName || last?.author || "Traveler";
      const username = profile?.username || title.toLowerCase().replace(/\s+/g, "");
      const photo = profile?.photo || profile?.photos?.find(Boolean) || "";
      const preview = last?.text || "Say hi to start the chat.";
      const timestamp = last?.createdAt || 0;
      const timeLabel = formatTimeLabel(timestamp, last?.time);
      const unreadCount = messages.filter((message) => message.authorId === otherId).length;

      return {
        id: `direct:${otherId}`,
        title,
        username,
        preview,
        timeLabel,
        timestamp,
        unreadCount,
        photo,
      };
    });

    buddies.forEach((buddy) => {
      const key = `direct:${buddy.id}`;
      if (items.some((item) => item.id === key)) return;
      items.push({
        id: key,
        title: buddy.name,
        username: buddy.username || buddy.name.toLowerCase().replace(/\s+/g, ""),
        preview: "Start a chat with this traveler.",
        timeLabel: "",
        timestamp: 0,
        unreadCount: 0,
        photo: buddy.photo || buddy.photos?.find(Boolean) || "",
      });
    });

    const latestGroup = groupChat[groupChat.length - 1];
    const groupTimestamp = latestGroup?.createdAt || 0;
    const groupTimeLabel = formatTimeLabel(groupTimestamp, latestGroup?.time);

    const aiItem: ChatItem = {
      id: "ai",
      title: "Roamio AI",
      username: "roamio.ai",
      preview: "Ask for routes, budgets, or trip tips.",
      timeLabel: "",
      timestamp: 0,
      unreadCount: 0,
      photo: "",
    };

    const notesItem: ChatItem = {
      id: "notes",
      title: "Direct Notes",
      username: "notes",
      preview: latestNotes?.text || "Save quick travel notes here.",
      timeLabel: notesTimeLabel,
      timestamp: notesTimestamp,
      unreadCount: 0,
      photo: "",
    };

    const communityItem: ChatItem = {
      id: "group",
      title: "Community",
      username: "community",
      preview: latestGroup?.text || "Jump into the community feed.",
      timeLabel: groupTimeLabel,
      timestamp: groupTimestamp,
      unreadCount: 0,
      photo: "",
    };

    const blendItems: ChatItem[] = blendChats.map((chat) => {
      const last = chat.messages?.[chat.messages.length - 1];
      const blendTimestamp = last?.createdAt || 0;
      return {
        id: chat.id,
        title: chat.title,
        username: chat.title.toLowerCase().replace(/\s+/g, ""),
        preview: last?.text || "Blend chat is ready.",
        timeLabel: formatTimeLabel(blendTimestamp, last?.time),
        timestamp: blendTimestamp,
        unreadCount: 0,
        photo: "",
      };
    });

    return [aiItem, notesItem, communityItem, ...blendItems, ...items].sort(
      (left, right) => (right.timestamp || 0) - (left.timestamp || 0)
    );
  }, [buddies, blendChats, currentProfileId, directMessages, getDirectMessagesForUser, getProfileById, groupChat]);

  useEffect(() => {
    setUnreadMap((current) => {
      const next = { ...current };
      conversations.forEach((item) => {
        if (typeof next[item.id] !== "number") {
          next[item.id] = item.unreadCount;
        } else if (item.unreadCount > next[item.id]) {
          next[item.id] = item.unreadCount;
        }
      });
      return next;
    });
  }, [conversations]);

  return (
    <Screen
      title="Chat"
      subtitle="Stay connected instantly."
      scroll={false}
    >
      <Panel>
        <Text style={styles.sectionLabel}>MESSAGES</Text>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {conversations.map((item) => {
            const unreadCount = unreadMap[item.id] ?? item.unreadCount;
            const showUnread = unreadCount > 0;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setUnreadMap((current) => ({ ...current, [item.id]: 0 }));
                  router.push({ pathname: "/(tabs)/chats/[id]", params: { id: item.id } });
                }}
                style={({ pressed, hovered }) => [
                  styles.chatRow,
                  (pressed || hovered) && styles.chatRowActive,
                ]}
              >
                <View style={styles.avatarSlot}>
                  {showUnread ? (
                    <LinearGradient colors={[palette.coral, palette.amber, palette.teal]} style={styles.avatarRing}>
                      <View style={styles.avatarInner}>
                        {item.photo ? (
                          <Image source={{ uri: item.photo }} style={styles.avatarImage} />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitials}>{initials(item.title)}</Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.avatarRingRead}>
                      {item.photo ? (
                        <Image source={{ uri: item.photo }} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitials}>{initials(item.title)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.chatContent}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      @{item.username}
                    </Text>
                    <Text style={styles.chatTime}>{item.timeLabel}</Text>
                  </View>
                  <View style={styles.previewBlock}>
                    <Text
                      style={[styles.chatPreview, showUnread && styles.chatPreviewUnread]}
                      numberOfLines={1}
                    >
                      {item.preview}
                    </Text>
                    {showUnread ? (
                      <Text style={styles.unreadLabel}>
                        {unreadCount} new message{unreadCount === 1 ? "" : "s"}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.chatRight}>
                  {showUnread ? <View style={styles.unreadDot} /> : null}
                </View>
              </Pressable>
            );
          })}

          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptyCopy}>Start a new trip note or message a traveler to see it here.</Text>
            </View>
          ) : null}
        </ScrollView>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: palette.amber,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  listContent: {
    gap: 12,
    paddingBottom: 140,
    paddingTop: 6,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: palette.panelAlt,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  chatRowActive: {
    backgroundColor: "rgba(57,167,255,0.12)",
    borderColor: "rgba(57,167,255,0.28)",
  },
  avatarSlot: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    padding: 2.5,
    borderRadius: 999,
  },
  avatarRingRead: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: palette.panelAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(25,196,182,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: palette.teal,
    fontWeight: "800",
  },
  chatContent: {
    flex: 1,
    gap: 6,
  },
  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  chatName: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 15,
    flex: 1,
  },
  chatTime: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "700",
  },
  chatPreview: {
    color: palette.textMuted,
    fontSize: 13,
  },
  chatPreviewUnread: {
    color: palette.text,
    fontWeight: "700",
  },
  previewBlock: {
    gap: 4,
  },
  unreadLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
  },
  chatRight: {
    alignItems: "center",
    gap: 10,
    paddingLeft: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#3b82f6",
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    gap: 8,
  },
  emptyTitle: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 16,
  },
  emptyCopy: {
    color: palette.textMuted,
    lineHeight: 20,
  },
});
