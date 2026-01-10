import { useEffect, useState } from "react";
import NewChat from "./NewChat";
import api from "../../services/api";
import { useChatStore } from "../../stores/chat.store";
import { fetchUsers } from "../../services/users.api";
import { useAuthStore } from "../../stores/auth.store";

export default function ChatList() {
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

  const openConversation = (c) => {
    setActiveChat({
      mode: "conversation",
      conversationId: c._id,
      label: c.title || "Chat",
    });
  };

  const getConversationTitle = (c) => {
    if (c.type === "group") return c.title;
    const other = c.members.find((m) => m.userId !== currentUserId);
    return userMap[other?.userId] || "Chat";
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
        <span className="font-bold text-lg text-slate-800">Messages</span>
        <button
          onClick={() => setShowNewChat(true)}
          className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors"
          title="New Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
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
                  ? "bg-indigo-50 border-l-4 border-indigo-500 shadow-sm"
                  : "hover:bg-slate-50 border-l-4 border-transparent"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isActive ? "bg-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                  }`}>
                  {getConversationTitle(c).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${isActive ? "text-indigo-900" : "text-slate-800"}`}>
                    {getConversationTitle(c)}
                  </div>
                  {c.lastMessage && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">
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
