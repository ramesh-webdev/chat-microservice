import { useEffect, useState } from "react";
import NewChat from "./NewChat";
import api from "../../services/api";
import { useChatStore } from "../../stores/chat.store";

export default function ChatList() {
  const [showNewChat, setShowNewChat] = useState(false);
  const [conversations, setConversations] = useState([]);

  const setActiveChat = useChatStore((s) => s.setActiveChat);

  // 1️⃣ Fetch existing conversations
  useEffect(() => {
    api
      .get("/chat/conversations")
      .then((res) => setConversations(res.data.conversations || []))
      .catch(console.error);
  }, []);

  // 2️⃣ Click existing conversation
  const openConversation = (c) => {
    setActiveChat({
      mode: "conversation",
      conversationId: c._id,
      label: c.title || "Chat",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b">
        <span className="font-bold">Chats</span>
        <button
          onClick={() => setShowNewChat(true)}
          className="text-green-600 font-medium"
        >
          + New
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 && (
          <div className="p-4 text-sm text-gray-500">
            No conversations yet
          </div>
        )}

        {conversations.map((c) => (
          <div
            key={c._id}
            onClick={() => openConversation(c)}
            className="p-3 border-b cursor-pointer hover:bg-gray-100"
          >
            <div className="font-medium">
              {c.title || "Private Chat"}
            </div>

            {c.lastMessage && (
              <div className="text-sm text-gray-500 truncate">
                {c.lastMessage}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <NewChat onClose={() => setShowNewChat(false)} />
      )}
    </div>
  );
}