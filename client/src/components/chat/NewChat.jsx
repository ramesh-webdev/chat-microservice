import { useEffect, useState } from "react";
import { fetchUsers } from "../../services/users.api";
import { useChatStore } from "../../stores/chat.store";
import CreateGroupModal from "./CreateGroupModal";

export default function NewChat({ onClose, onChatCreated }) {
  const [users, setUsers] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const [search, setSearch] = useState("");

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

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-slate-800">New Chat</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 border-b border-slate-100">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-slate-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-indigo-50 group transition-colors mb-2"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <span className="block font-semibold text-indigo-700">Create New Group</span>
              <span className="text-xs text-indigo-400">Add multiple members</span>
            </div>
          </button>

          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            All Users
          </div>

          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => selectUser(u)}
              className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                {(u.name || u.phone || "?").charAt(0).toUpperCase()}
              </div>
              <div className="font-medium text-slate-700">
                {u.name || u.phone}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
