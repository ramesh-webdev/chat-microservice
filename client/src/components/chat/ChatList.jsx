import { useEffect, useState } from "react";
import NewChat from "./NewChat";
import api from "../../services/api";
import { useChatStore } from "../../stores/chat.store";
import { fetchUsers } from "../../services/users.api";
import { useAuthStore } from "../../stores/auth.store";
import useSocket from "../../hooks/useSocket";
import { useThemeStore } from "../../stores/theme.store";

export default function ChatList() {
  const socket = useSocket();
  const { theme, toggleTheme } = useThemeStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [userMap, setUserMap] = useState({});
  const currentUserId = useAuthStore.getState().user._id;

  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const activeChat = useChatStore((s) => s.activeChat);

  useEffect(() => {
    fetchUsers().then((res) => {
      const map = {};
      res.data.users.forEach((u) => {
        map[u._id] = u.name || u.phone;
      });
      setUserMap(map);
    });
  }, []);

  const fetchConversations = () => {
    api
      .get("/chat/conversations")
      .then((res) => setConversations(res.data.conversations || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Real-time updates for unread count and last message
  useEffect(() => {
    if (!socket) return;

    const onMessageNew = (msg) => {
      setConversations((prev) => {
        // If conversation doesn't exist in list (new one started by other), fetch all
        const exists = prev.find((c) => c._id === msg.conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }

        const updated = prev.map((c) => {
          if (c._id === msg.conversationId) {
            const isMine = msg.senderId === currentUserId;
            // If I am sending, or if the chat is currently open, don't increment
            const isRead = isMine || activeChat?.conversationId === c._id;

            return {
              ...c,
              lastMessage: msg.content,
              unreadCount: isRead ? (c.unreadCount || 0) : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });

        // Move updated conversation to top
        const target = updated.find(c => c._id === msg.conversationId);
        const others = updated.filter(c => c._id !== msg.conversationId);
        return target ? [target, ...others] : updated;
      });
    };

    // Also listen for new conversations created (e.g. by others adding us to groups)
    const onConversationCreated = () => {
      fetchConversations();
    };

    socket.on("message:new", onMessageNew);
    socket.on("conversation:created", onConversationCreated);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("conversation:created", onConversationCreated);
    };
  }, [socket, activeChat, currentUserId]);

  const openConversation = (c) => {
    setActiveChat({
      mode: "conversation",
      conversationId: c._id,
      label: c.title || "Chat",
    });

    // Optimistically mark as read
    setConversations(prev =>
      prev.map(conv => conv._id === c._id ? { ...conv, unreadCount: 0 } : conv)
    );
  };

  const getConversationTitle = (c) => {
    if (c.type === "group") return c.title;
    const other = c.members.find((m) => m.userId !== currentUserId);
    return userMap[other?.userId] || "Chat";
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <span className="font-bold text-lg text-slate-800 dark:text-white">Messages</span>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-auto p-2">
        {conversations.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">
            No conversations yet
          </div>
        )}

        {conversations.map((c) => {
          const isActive = activeChat?.conversationId === c._id;
          return (
            <div
              key={c._id}
              onClick={() => openConversation(c)}
              className={`p-3 mb-1 rounded-xl cursor-pointer transition-all duration-200 group ${isActive
                ? "bg-indigo-50 border-l-4 border-indigo-500 shadow-sm dark:bg-indigo-900/20 dark:border-indigo-400"
                : "hover:bg-slate-50 border-l-4 border-transparent dark:hover:bg-slate-800"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isActive
                    ? "bg-indigo-200 text-indigo-700 dark:bg-indigo-500 dark:text-white"
                    : "bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-indigo-900 dark:group-hover:text-indigo-300"
                    }`}>
                    {c.type === "group" ? (
                      <span className="text-xs">👥</span>
                    ) : (
                      getConversationTitle(c).charAt(0).toUpperCase()
                    )}
                  </div>
                  {/* Online status indicator could go here */}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className={`font-semibold text-sm ${isActive ? "text-indigo-900 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"}`}>
                      {getConversationTitle(c)}
                    </div>
                    {/* Unread Badge */}
                    {c.unreadCount > 0 && (
                      <div className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center dark:bg-indigo-500">
                        {c.unreadCount}
                      </div>
                    )}
                  </div>

                  {c.lastMessage && (
                    <div className={`text-xs truncate mt-0.5 ${c.unreadCount > 0 ? "font-medium text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                      {c.lastMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNewChat && <NewChat onClose={() => setShowNewChat(false)} onChatCreated={fetchConversations} />}
    </div>
  );
}
