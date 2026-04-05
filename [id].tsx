import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { onValue, push, ref, remove } from "firebase/database";
import { Screen, Panel } from "../../../src/components/Screen";
import { useAppData } from "../../../src/contexts/AppDataContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { realtimeDb } from "../../../src/firebase/firebase";
import { askAI } from "../../../src/services/ai";
import { palette } from "../../../src/theme/palette";

type AiMessage = { id: string; role: "assistant" | "user"; text: string; createdAt?: number };

const MAX_AI_MESSAGES = 40;
const defaultAiMessage: AiMessage = {
  id: "ai-1",
  role: "assistant",
  text: "Ask for routes, budgets, or trip tips.",
};

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const threadId = id || "ai";
  const { user } = useAuth();
  const currentProfileId = user?._id || "self";
  const {
    groupChat,
    blendChats,
    sendDirectMessage,
    sendGroupMessage,
    sendBlendMessage,
    getDirectMessagesForUser,
    getProfileById,
  } = useAppData();
  const [draft, setDraft] = useState("");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([defaultAiMessage]);

  const directUserId = threadId.startsWith("direct:") ? threadId.slice("direct:".length) : null;
  const activeDirectBuddy = directUserId ? getProfileById(directUserId) : null;
  const directThreadMessages = useMemo(() => getDirectMessagesForUser(directUserId), [directUserId, getDirectMessagesForUser]);
  const activeBlend = useMemo(() => blendChats.find((chat) => chat.id === threadId), [blendChats, threadId]);

  const headerTitle =
    threadId === "ai"
      ? "Roamio AI"
      : threadId === "notes"
        ? "Direct Notes"
        : threadId === "group"
          ? "Community"
          : activeBlend?.title || activeDirectBuddy?.name || "Chat";

  useEffect(() => {
    if (threadId !== "ai") return;
    if (!currentProfileId || currentProfileId === "self") return;

    const aiRef = ref(realtimeDb, `mobileUsers/${currentProfileId}/aiChats`);
    const unsubscribe = onValue(
      aiRef,
      (snapshot) => {
        const value = snapshot.val() as Record<string, AiMessage> | null;
        const items = Object.entries(value || {}).map(([key, message]) => ({
          id: key,
          role: message.role,
          text: message.text,
          createdAt: message.createdAt,
        }));

        items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setAiMessages(items.length > 0 ? items : [defaultAiMessage]);

        if (items.length > MAX_AI_MESSAGES) {
          const excess = items.slice(0, items.length - MAX_AI_MESSAGES);
          excess.forEach((item) => {
            void remove(ref(realtimeDb, `mobileUsers/${currentProfileId}/aiChats/${item.id}`));
          });
        }
      },
      () => {
        // Keep local AI messages if Firebase is unavailable.
      }
    );

    return () => unsubscribe();
  }, [currentProfileId, threadId]);

  async function handleSend() {
    if (!draft.trim()) return;

    if (threadId === "ai") {
      const nextPrompt = draft.trim();
      const userMessage: AiMessage = { id: `ai-${Date.now()}`, role: "user", text: nextPrompt, createdAt: Date.now() };
      setAiMessages((current) => [...current, userMessage]);
      setDraft("");

      if (currentProfileId && currentProfileId !== "self") {
        try {
          await push(ref(realtimeDb, `mobileUsers/${currentProfileId}/aiChats`), {
            role: userMessage.role,
            text: userMessage.text,
            createdAt: userMessage.createdAt,
          });
        } catch {
          // Keep local copy if Firebase is unavailable.
        }
      }

      try {
        const reply = await askAI(nextPrompt, "chat");
        const assistantMessage: AiMessage = {
          id: `ai-${Date.now() + 1}`,
          role: "assistant",
          text: reply,
          createdAt: Date.now() + 1,
        };
        setAiMessages((current) => [...current, assistantMessage]);
        if (currentProfileId && currentProfileId !== "self") {
          try {
            await push(ref(realtimeDb, `mobileUsers/${currentProfileId}/aiChats`), {
              role: assistantMessage.role,
              text: assistantMessage.text,
              createdAt: assistantMessage.createdAt,
            });
          } catch {
            // Keep local copy if Firebase is unavailable.
          }
        }
      } catch {
        const assistantMessage: AiMessage = {
          id: `ai-${Date.now() + 1}`,
          role: "assistant",
          text: "Roamio AI is busy right now. Please try again in a moment.",
          createdAt: Date.now() + 1,
        };
        setAiMessages((current) => [...current, assistantMessage]);
        if (currentProfileId && currentProfileId !== "self") {
          try {
            await push(ref(realtimeDb, `mobileUsers/${currentProfileId}/aiChats`), {
              role: assistantMessage.role,
              text: assistantMessage.text,
              createdAt: assistantMessage.createdAt,
            });
          } catch {
            // Keep local copy if Firebase is unavailable.
          }
        }
      }
      return;
    }

    if (threadId === "group") {
      await sendGroupMessage(draft);
      setDraft("");
      return;
    }

    if (activeBlend) {
      await sendBlendMessage(activeBlend.id, draft);
      setDraft("");
      return;
    }

    await sendDirectMessage(draft, activeDirectBuddy ? { id: activeDirectBuddy.id, name: activeDirectBuddy.name } : undefined);
    setDraft("");
  }

  return (
    <Screen title={headerTitle} subtitle="Messages from this thread." scroll>
      <Panel>
        <Text style={styles.sectionLabel}>{headerTitle.toUpperCase()}</Text>
        <View style={styles.feed}>
          {threadId === "ai" &&
            aiMessages.map((message) => (
              <View key={message.id} style={[styles.bubble, message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={styles.bubbleText}>{message.text}</Text>
              </View>
            ))}

          {threadId === "notes" &&
            getDirectMessagesForUser("notes").map((message) => (
              <View key={message.id} style={styles.bubbleAssistant}>
                <Text style={styles.messageAuthor}>{message.author}</Text>
                <Text style={styles.bubbleText}>{message.text}</Text>
              </View>
            ))}

          {directUserId &&
            directThreadMessages.map((message) => (
              <View
                key={message.id}
                style={[styles.bubble, message.authorId === directUserId ? styles.bubbleAssistant : styles.bubbleUser]}
              >
                <Text style={styles.messageAuthor}>{message.author}</Text>
                <Text style={styles.bubbleText}>{message.text}</Text>
              </View>
            ))}

          {threadId === "group" &&
            groupChat.map((message) => (
              <View key={message.id} style={styles.bubbleAssistant}>
                <Text style={styles.messageAuthor}>{message.author}</Text>
                <Text style={styles.bubbleText}>{message.text}</Text>
              </View>
            ))}

          {activeBlend?.messages.map((message) => (
            <View key={message.id} style={styles.bubbleAssistant}>
              <Text style={styles.messageAuthor}>{message.author}</Text>
              <Text style={styles.bubbleText}>{message.text}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder={
            activeDirectBuddy ? `Message ${activeDirectBuddy.name}` : threadId === "ai" ? "Ask Roamio AI" : "Type a message"
          }
          placeholderTextColor={palette.textDim}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
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
  feed: {
    gap: 10,
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
  },
  bubbleAssistant: {
    backgroundColor: palette.panelAlt,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: "rgba(57,167,255,0.16)",
    alignSelf: "flex-end",
  },
  bubbleText: {
    color: palette.text,
    lineHeight: 20,
  },
  messageAuthor: {
    color: palette.teal,
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: palette.panelAlt,
    color: palette.text,
    padding: 14,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: palette.teal,
    borderRadius: 16,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: palette.bg,
    fontWeight: "900",
  },
});
