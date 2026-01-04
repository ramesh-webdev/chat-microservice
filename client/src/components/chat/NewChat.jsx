import { useEffect, useState } from "react";
import { fetchUsers } from "../../services/users.api";
import { useChatStore } from "../../stores/chat.store";

import CreateGroupModal from "./CreateGroupModal";

export default function NewChat({ onClose, onChatCreated }) {
  const [users, setUsers] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  useEffect(() => {
    fetchUsers().then((res) => setUsers(res.data.users));
  }, []);

  const selectUser = (user) => {
    setActiveChat({
      mode: "user",
      userId: user._id,
      label: user.phone,
    });
    onClose();
  };

  if (showGroupModal) {
    return (
      <CreateGroupModal
        onClose={() => setShowGroupModal(false)}
        onSuccess={(group) => {
          onChatCreated && onChatCreated();
          onClose();
        }}
      />
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">New Chat</h2>
        <button
          onClick={() => setShowGroupModal(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          Create Group
        </button>
      </div>

      {users.map((u) => (
        <div
          key={u._id}
          onClick={() => selectUser(u)}
          className="p-3 border-b cursor-pointer hover:bg-gray-100"
        >
          {u.name || u.phone}
        </div>
      ))}
    </div>
  );
}
