import { useEffect, useState, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import useSocket from "../../hooks/useSocket";
import { useChatStore } from "../../stores/chat.store";
import { fetchMessages } from "../../services/chat.api";
import { useAuthStore } from "../../stores/auth.store";

export default function ChatWindow() {
  const socket = useSocket();
  const typingTimeoutRef = useRef(null);
  const { activeChat } = useChatStore();
  const isChatActive = useRef(false);
  const currentUserId = useAuthStore.getState().user._id;
  const [typingUsers, setTypingUsers] = useState({});

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingOld, setLoadingOld] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState([]);
  const [membersCount, setMembersCount] = useState(0);

  const messagesEndRef = useRef(null);
  const prevLastMessageId = useRef(null);

  const [selectedMsgIds, setSelectedMsgIds] = useState(new Set());
  const [editingMessage, setEditingMessage] = useState(null);

  const toggleSelection = (msgId) => {
    setSelectedMsgIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) newSet.delete(msgId);
      else newSet.add(msgId);
      return newSet;
    });
  };

  const handleEditClick = () => {
    if (selectedMsgIds.size !== 1) return;
    const msgId = Array.from(selectedMsgIds)[0];
    const msg = messages.find(m => m._id === msgId);

    if (!msg) return;

    // Permission Check
    const sId = msg.senderId?._id || msg.senderId;
    if (String(sId) !== String(currentUserId)) {
      alert("You can only edit your own messages.");
      return;
    }

    // Time Check (15 mins)
    const timeDiff = Date.now() - new Date(msg.createdAt).getTime();
    if (timeDiff > 15 * 60 * 1000) {
      alert("You can only edit messages sent within 15 minutes.");
      return;
    }

    setEditingMessage(msg);
    setSelectedMsgIds(new Set());
  };

  function deriveStatus(message, statuses, currentUserId) {
    const sId = message.senderId?._id || message.senderId;
    if (String(sId) !== String(currentUserId)) return;

    const rows = statuses.filter((s) => s.messageId === message._id);
    const others = rows.filter((r) => r.userId !== currentUserId);

    if (others.some((r) => r.status === "read")) return "read";
    if (others.some((r) => r.status === "delivered")) return "delivered";
    return "sent";
  }

  useEffect(() => {
    if (!activeChat?.conversationId) return;

    setMessages([]);
    setCursor(null);
    prevLastMessageId.current = null; // Reset scroll tracker

    fetchMessages(activeChat.conversationId)
      .then((res) => {
        setMessageStatuses(res.data.statuses);
        setMembersCount(res.data.membersCount);

        const msgs = res.data.messages.map((msg) => {
          const sId = msg.senderId?._id || msg.senderId;
          if (String(sId) !== String(currentUserId)) return msg;

          return {
            ...msg,
            status: deriveStatus(msg, res.data.statuses, currentUserId),
          };
        });

        setMessages(msgs);
        setCursor(res.data.nextCursor);
      })
      .catch(console.error);
  }, [activeChat]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => {
        const sId = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
        if (String(sId) !== String(currentUserId)) return m;
        return {
          ...m,
          status: deriveStatus(m, messageStatuses, currentUserId),
        };
      })
    );
  }, [messageStatuses]);

  useEffect(() => {
    isChatActive.current = true;
    return () => {
      isChatActive.current = false;
    };
  }, [activeChat?.conversationId]);

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.on("typing", ({ conversationId, userId, isTyping }) => {
      if (conversationId !== activeChat.conversationId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    });

    socket.on("message:new", (msg) => {
      // Ignore own messages to avoid duplicates (optimistic update handled them)
      const sId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
      if (String(sId) === String(currentUserId)) return;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message:status:update", ({ updates }) => {
      setMessageStatuses((prev) => {
        const map = new Map(prev.map((s) => [`${s.messageId}_${s.userId}`, s]));
        updates.forEach((u) => {
          map.set(`${u.messageId}_${u.userId}`, u);
        });
        return Array.from(map.values());
      });
    });

    socket.on("message:reaction:update", ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, reactions } : m
      ));
    });

    socket.on("message:content:update", ({ messageId, content, isEdited }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, content, isEdited } : m
      ));
    });

    return () => {
      socket.off("typing");
      socket.off("message:new");
      socket.off("message:status:update");
      socket.off("message:reaction:update");
      socket.off("message:content:update");
    };
  }, [socket, activeChat?.conversationId]);

  useEffect(() => {
    setSelectedMsgIds(new Set());
    setEditingMessage(null);
  }, [activeChat?.conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // Scroll if last message changed (new message sent/received, or initial load)
    if (lastMsg._id !== prevLastMessageId.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevLastMessageId.current = lastMsg._id;
    }
  }, [messages]);

  useEffect(() => {
    setTypingUsers({});
  }, [activeChat?.conversationId]);

  const typingUserIds = Object.keys(typingUsers).filter(
    (id) => typingUsers[id]
  );

  useEffect(() => {
    if (!socket) return;

    const onMessageSent = ({ clientMessageId, messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, _id: messageId, status: "sent" }
            : m
        )
      );
    };

    socket.on("message:sent", onMessageSent);

    return () => {
      socket.off("message:sent", onMessageSent);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;
    if (!isChatActive.current) return;

    socket.emit("conversation:read", {
      conversationId: activeChat.conversationId,
    });
  }, [messages]);

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.emit("join_conversation", {
      conversationId: activeChat.conversationId,
    });

    return () => {
      socket.emit("leave_conversation", {
        conversationId: activeChat.conversationId,
      });
      socket.off("message:new");
    };
  }, [socket, activeChat]);

  useEffect(() => {
    if (!socket) return;
    socket.on("conversation:created", ({ conversationId }) => {
      useChatStore.getState().setActiveChat({
        mode: "conversation",
        conversationId,
        title: "Chat",
      });
      socket.emit("join_conversation", { conversationId });
    });
    return () => socket.off("conversation:created");
  }, [socket]);

  const loadOlderMessages = async () => {
    if (!cursor || loadingOld) return;
    setLoadingOld(true);
    try {
      const res = await fetchMessages(activeChat.conversationId, cursor);
      setMessages((prev) => [...res.data.messages, ...prev]);
      setCursor(res.data.nextCursor);
    } finally {
      setLoadingOld(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !activeChat?.conversationId) return;
    socket.emit("typing", {
      conversationId: activeChat.conversationId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        conversationId: activeChat.conversationId,
        isTyping: false,
      });
    }, 800);
  };

  const sendMessage = (msg) => {
    const text = msg.text;
    const tempId = "temp_" + Date.now();

    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        clientMessageId: tempId,
        senderId: currentUserId,
        content: text,
        status: "sending",
        createdAt: new Date().toISOString(), // Required for "Edit" button visibility check
      },
    ]);

    if (activeChat.mode === "conversation") {
      socket.emit("message:create", {
        conversationId: activeChat.conversationId,
        content: text,
        clientMessageId: tempId,
        attachments: msg.attachments || [],
      });
    }

    if (activeChat.mode === "user") {
      socket.emit("message:create", {
        receiverId: activeChat.userId,
        content: text,
        clientMessageId: tempId,
        attachments: msg.attachments || [],
      });
    }
  };

  if (!activeChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span className="text-lg">Select a chat to start messaging</span>
      </div>
    );
  }

  const isSelectionMode = selectedMsgIds.size > 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      {isSelectionMode ? (
        <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/50 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedMsgIds(new Set())} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="font-bold text-indigo-900 dark:text-indigo-200">{selectedMsgIds.size} selected</span>
          </div>
          <div className="flex gap-2">
            {selectedMsgIds.size === 1 && (() => {
              const msgId = Array.from(selectedMsgIds)[0];
              const msg = messages.find(m => m._id === msgId);
              const sId = msg?.senderId?._id || msg?.senderId;
              const isMine = String(sId) === String(currentUserId);
              const isRecent = msg && (Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000);

              return isMine && isRecent ? (
                <button onClick={handleEditClick} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
              ) : null;
            })()}
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 flex items-center justify-center font-bold text-lg">
              {activeChat.mode === 'conversation' && membersCount > 2 ? (
                <span className="text-sm">👥</span>
              ) : (
                (activeChat.title || "C").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white leading-tight">
                {activeChat.title || "Chat"}
              </h2>
              {typingUserIds.length > 0 ? (
                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium animate-pulse">typing...</span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activeChat.mode === 'conversation' && membersCount > 0 ? `${membersCount} members` : 'Online'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-2 relative">
        {cursor && (
          <div className="text-center mb-4">
            <button
              onClick={loadOlderMessages}
              className="px-4 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              {loadingOld ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isSelected={selectedMsgIds.has(msg._id)}
            onToggleSelect={() => toggleSelection(msg._id)}
            selectionMode={isSelectionMode}
            isGroup={activeChat.mode === 'conversation' && membersCount > 2}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        onTyping={handleTyping}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
