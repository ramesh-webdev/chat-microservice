import { useState, useEffect } from "react";
import { searchUsers, createGroupConversation } from "../../services/chat.api";

export default function CreateGroupModal({ onClose, onSuccess }) {
    const [name, setName] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        searchUsers("")
            .then((res) => setUsers(res.data.users || []))
            .catch(console.error);
    }, []);

    const toggleUser = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const create = async () => {
        if (!name || selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const res = await createGroupConversation(name, selectedUsers);
            onSuccess(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">Create Group</h2>
                    <p className="text-sm text-slate-500 mt-1">Name your group and add members</p>
                </div>

                <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Group Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Team"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Select Members ({selectedUsers.length})
                        </label>
                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                            {users.map((u) => {
                                const isSelected = selectedUsers.includes(u._id);
                                return (
                                    <div
                                        key={u._id}
                                        onClick={() => toggleUser(u._id)}
                                        className={`p-3 cursor-pointer flex justify-between items-center transition-colors ${isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? "bg-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-600"
                                                }`}>
                                                {(u.name || u.phone).charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`text-sm ${isSelected ? "font-semibold text-indigo-900" : "text-slate-700"}`}>
                                                {u.name || u.phone}
                                            </span>
                                        </div>

                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                                            }`}>
                                            {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={create}
                        disabled={loading || !name || selectedUsers.length === 0}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 transition-all active:scale-95"
                    >
                        {loading ? "Creating..." : "Create Group"}
                    </button>
                </div>
            </div>
        </div>
    );
}
