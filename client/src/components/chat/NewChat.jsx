import { useEffect, useState } from "react";
import { fetchUsers } from "../../services/users.api";
import { useChatStore } from "../../stores/chat.store";

export default function NewChat({ onClose }) {
  const [users, setUsers] = useState([]);
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

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-3">New Chat</h2>

      {users.map((u) => (
        <div
          key={u._id}
          onClick={() => selectUser(u)}
          className="p-3 border-b cursor-pointer hover:bg-gray-100"
        >
          {u.phone}
        </div>
      ))}
    </div>
  );
}
