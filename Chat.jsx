import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";
import { askAI } from "../services/aiService";

function liveStamp(time) {
  if (!time) return "Just now";
  return `${time} live`;
}

function getInitials(name) {
  return String(name || "AI")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function EmptyThreadState({ title, copy, actionLabel }) {
  return (
    <div className="chat-empty-shell">
      <div className="chat-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="presentation">
          <path d="M8 12h32v24H8z" fill="none" stroke="currentColor" strokeWidth="2.4" rx="6" />
          <path d="m14 18 10 8 10-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <button type="button" disabled>
        {actionLabel}
      </button>
    </div>
  );
}

function Chat() {
  const {
    directMessages,
    groupChat,
    blendChats,
    sendDirectMessage,
    sendGroupMessage,
    sendBlendMessage,
    loading,
    profile,
    buddies,
  } = useAppData();
  const location = useLocation();
  const { showToast } = useToast();
  const [activeThread, setActiveThread] = useState("ai");
  const [groupDraft, setGroupDraft] = useState("");
  const [directDraft, setDirectDraft] = useState("");
  const [blendDraft, setBlendDraft] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      text: "Ask for routes, budget tips, packing advice, or local food suggestions.",
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiFeedRef = useRef(null);
  const directFeedRef = useRef(null);
  const groupFeedRef = useRef(null);
  const blendFeedRef = useRef(null);

  useEffect(() => {
    if (!aiFeedRef.current) return;
    aiFeedRef.current.scrollTop = aiFeedRef.current.scrollHeight;
  }, [aiMessages]);

  useEffect(() => {
    if (!directFeedRef.current) return;
    directFeedRef.current.scrollTop = directFeedRef.current.scrollHeight;
  }, [directMessages]);

  useEffect(() => {
    if (!groupFeedRef.current) return;
    groupFeedRef.current.scrollTop = groupFeedRef.current.scrollHeight;
  }, [groupChat]);

  useEffect(() => {
    if (!blendFeedRef.current) return;
    blendFeedRef.current.scrollTop = blendFeedRef.current.scrollHeight;
  }, [blendChats, activeThread]);

  useEffect(() => {
    if (!location.state?.threadId) return;
    setActiveThread(location.state.threadId);
  }, [location.state]);

  const threads = useMemo(() => {
    const coreThreads = [
      {
        id: "ai",
        title: "Roamio AI",
        meta: aiLoading ? "Replying now" : "Travel assistant",
        preview: aiMessages[aiMessages.length - 1]?.text || "Start a travel question",
        badge: "AI",
        type: "ai",
      },
      {
        id: "direct",
        title: "Direct Messages",
        meta: `${directMessages.length} note${directMessages.length === 1 ? "" : "s"}`,
        preview:
          directMessages[directMessages.length - 1]?.text ||
          "Private trip notes stay here.",
        badge: "DM",
        type: "direct",
      },
      {
        id: "group",
        title: "Community Chat",
        meta: `${groupChat.length} live post${groupChat.length === 1 ? "" : "s"}`,
        preview:
          groupChat[groupChat.length - 1]?.text ||
          "Jump into the shared room.",
        badge: "GR",
        type: "group",
      },
    ];

    const friendThreads = (buddies || []).slice(0, 10).map((buddy) => {
      const friendMessages = directMessages.filter((msg) => msg.toId === buddy.id);
      const lastMessage = friendMessages[friendMessages.length - 1];
      return {
        id: `friend-${buddy.id}`,
        friendId: buddy.id,
        title: buddy.name,
        meta: `${buddy.matchScore || 0}% match • ${buddy.destination || "Flexible"}`,
        preview: lastMessage?.text || "Start a trip chat with this match.",
        badge: "FR",
        type: "friend",
      };
    });

    const blendThreads = blendChats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      meta: chat.mode === "duo" ? "Blend duo" : "Blend group",
      preview:
        chat.messages?.[chat.messages.length - 1]?.text ||
        `Members: ${(chat.members || []).map((member) => member.name).join(", ") || "None yet"}`,
      badge: chat.mode === "duo" ? "D2" : "BG",
      type: "blend",
    }));

    return [...coreThreads, ...friendThreads, ...blendThreads];
  }, [aiLoading, aiMessages, directMessages, groupChat, blendChats, buddies]);

  const selectedThread = threads.find((thread) => thread.id === activeThread) || threads[0];
  const activeBlendChat = blendChats.find((chat) => chat.id === activeThread);
  const activeFriend = (buddies || []).find(
    (buddy) => `friend-${buddy.id}` === activeThread
  );
  const friendMessages = useMemo(
    () => directMessages.filter((msg) => msg.toId === activeFriend?.id),
    [directMessages, activeFriend]
  );

  async function handleAiChat() {
    if (!aiPrompt.trim() || aiLoading) return;

    const nextUserMessage = { role: "user", text: aiPrompt.trim() };
    setAiMessages((current) => [...current, nextUserMessage]);
    setAiPrompt("");
    setAiLoading(true);

    try {
      const reply = await askAI(nextUserMessage.text, "chat");
      setAiMessages((current) => [...current, { role: "assistant", text: reply }]);
      showToast({
        title: "AI response received",
        message: "Roamio AI replied in your travel assistant thread.",
        tone: "success",
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function handleDirectSend() {
    if (!directDraft.trim()) return;
    await sendDirectMessage(directDraft, activeFriend && { id: activeFriend.id, name: activeFriend.name });
    setDirectDraft("");
    showToast({
      title: activeFriend ? "Message sent to match" : "Direct message sent",
      message: activeFriend ? `Shared a note with ${activeFriend.name}.` : "Your personal trip note was added.",
      tone: "success",
    });
  }

  async function handleGroupSend() {
    if (!groupDraft.trim()) return;
    await sendGroupMessage(groupDraft);
    setGroupDraft("");
    showToast({
      title: "Community message sent",
      message: "Your message is now visible in the group room.",
      tone: "success",
    });
  }

  async function handleBlendSend() {
    if (!blendDraft.trim() || !activeBlendChat) return;
    await sendBlendMessage(activeBlendChat.id, blendDraft);
    setBlendDraft("");
    showToast({
      title: "Blend message sent",
      message: "Your update is now in the dedicated blend thread.",
      tone: "success",
    });
  }

  return (
    <div className="page-grid">
      <section className="chat-shell panel">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-top">
            <div>
              <p className="eyebrow">Messaging</p>
              <h2>AI Chat</h2>
            </div>
            <button type="button" className="chat-compose-button" aria-label="Compose new chat">
              +
            </button>
          </div>

          <div className="chat-thread-list">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`chat-thread-item ${activeThread === thread.id ? "chat-thread-item-active" : ""}`}
                onClick={() => setActiveThread(thread.id)}
              >
                <div className="chat-thread-avatar">{thread.badge}</div>
                <div className="chat-thread-copy">
                  <div className="chat-thread-title-row">
                    <strong>{thread.title}</strong>
                    <small>{thread.meta}</small>
                  </div>
                  <span>{thread.preview}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="chat-main">
          <header className="chat-main-header">
            <div className="chat-main-title">
              <div className="chat-main-avatar">{getInitials(selectedThread.title)}</div>
              <div>
                <h3>{selectedThread.title}</h3>
                <p>{selectedThread.meta}</p>
              </div>
            </div>
          </header>

          {selectedThread?.type === "ai" && (
            <div className="chat-main-body">
              <div className="chat-message-feed ai-feed" ref={aiFeedRef}>
                {aiMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`message-bubble ${
                      message.role === "assistant" ? "assistant-bubble" : "user-bubble"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {aiLoading && <div className="message-bubble assistant-bubble">Thinking through your trip...</div>}
              </div>
              <div className="chat-composer">
                <textarea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="Ask about routes, budgets, packing, or where to go next"
                />
                <div className="panel-actions chat-composer-actions">
                  <button type="button" onClick={handleAiChat} disabled={aiLoading || !aiPrompt.trim()}>
                    {aiLoading ? "Thinking..." : "Send message"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(selectedThread?.type === "direct" || selectedThread?.type === "friend") && (
            <div className="chat-main-body">
              <div className="chat-message-feed" ref={directFeedRef}>
                {loading && <div className="list-card">Loading direct messages...</div>}
                {!loading &&
                  (selectedThread?.type === "friend" ? friendMessages.length === 0 : directMessages.length === 0) && (
                    <div className="chat-empty-panel">
                      <h4>{selectedThread?.type === "friend" ? `Start a chat with ${activeFriend?.name}` : "No messages yet"}</h4>
                      <p>
                        {selectedThread?.type === "friend"
                          ? "Share trip ideas, timing, and budget to kick things off."
                          : "Use this space for private notes and quick check-ins."}
                      </p>
                    </div>
                  )}
                {(selectedThread?.type === "friend" ? friendMessages : directMessages).map((message) => (
                  <div key={message.id} className="chat-message-row">
                    <div className="chat-message-avatar">{getInitials(message.author)}</div>
                    <div className="list-card list-card-column chat-thread-card">
                      <div className="chat-thread-head">
                        <strong>{message.author}</strong>
                        <small>{liveStamp(message.time)}</small>
                        {message.toName && <span className="chat-message-chip">to {message.toName}</span>}
                      </div>
                      <span>{message.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-composer">
                <textarea
                  value={directDraft}
                  onChange={(event) => setDirectDraft(event.target.value)}
                  placeholder={
                    selectedThread?.type === "friend"
                      ? `Message ${activeFriend?.name || "your match"}`
                      : "Write a direct trip note"
                  }
                />
                <div className="panel-actions chat-composer-actions">
                  <button type="button" onClick={handleDirectSend} disabled={!directDraft.trim()}>
                    {selectedThread?.type === "friend" ? "Send" : "Send message"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedThread?.type === "group" && (
            <div className="chat-main-body">
              <div className="chat-message-feed" ref={groupFeedRef}>
                {loading && <div className="list-card">Loading community chat...</div>}
                {!loading && groupChat.length === 0 && (
                  <EmptyThreadState
                    title="Community Messages"
                    copy="The room is quiet right now. Drop the first travel update."
                    actionLabel="Post Message"
                  />
                )}
                {groupChat.map((message) => (
                  <div key={message.id} className="chat-message-row">
                    <div className="chat-message-avatar">{getInitials(message.author)}</div>
                    <div className="list-card list-card-column chat-thread-card">
                      <div className="chat-thread-head">
                        <strong>{message.author}</strong>
                        <small>{liveStamp(message.time)}</small>
                      </div>
                      <span>{message.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-composer">
                <textarea
                  value={groupDraft}
                  onChange={(event) => setGroupDraft(event.target.value)}
                  placeholder={`Share something with ${profile?.destination || "the community"}`}
                />
                <div className="panel-actions chat-composer-actions">
                  <button type="button" onClick={handleGroupSend} disabled={!groupDraft.trim()}>
                    Send message
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedThread?.type === "blend" && activeBlendChat && (
            <div className="chat-main-body">
              <div className="chat-message-feed" ref={blendFeedRef}>
                <div className="chat-blend-summary">
                  <p className="eyebrow">Blend members</p>
                  <div className="tag-row">
                    {(activeBlendChat.members || []).length > 0 ? (
                      activeBlendChat.members.map((member) => (
                        <span key={member.id} className="tag-pill">
                          {member.name} {member.matchScore ? `• ${member.matchScore}%` : ""}
                        </span>
                      ))
                    ) : (
                      <span className="tag-pill">Waiting for new matches</span>
                    )}
                  </div>
                </div>
                {(activeBlendChat.messages || []).map((message) => (
                  <div key={message.id} className="chat-message-row">
                    <div className="chat-message-avatar">{getInitials(message.author)}</div>
                    <div className="list-card list-card-column chat-thread-card">
                      <div className="chat-thread-head">
                        <strong>{message.author}</strong>
                        <small>{liveStamp(message.time)}</small>
                      </div>
                      <span>{message.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-composer">
                <textarea
                  value={blendDraft}
                  onChange={(event) => setBlendDraft(event.target.value)}
                  placeholder={`Message ${activeBlendChat.title}`}
                />
                <div className="panel-actions chat-composer-actions">
                  <button type="button" onClick={handleBlendSend} disabled={!blendDraft.trim()}>
                    Send to blend
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Chat;
