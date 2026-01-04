import { useState, useEffect } from "react";
import { searchUsers, createGroupConversation } from "../../services/chat.api";
import { useAuthStore } from "../../stores/auth.store";

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Create Group</h2>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Group Name"
                    className="border p-2 rounded mb-4 w-full"
                />

                <div className="flex-1 overflow-y-auto mb-4 border rounded p-2">
                    {users.map((u) => (
                        <div
                            key={u._id}
                            onClick={() => toggleUser(u._id)}
                            className={`p-2 cursor-pointer flex justify-between items-center hover:bg-gray-50 ${selectedUsers.includes(u._id) ? "bg-blue-50" : ""
                                }`}
                        >
                            <span>{u.name}</span>
                            {selectedUsers.includes(u._id) && (
                                <span className="text-blue-600">✓</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600">
                        Cancel
                    </button>
                    <button
                        onClick={create}
                        disabled={loading || !name || selectedUsers.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}
