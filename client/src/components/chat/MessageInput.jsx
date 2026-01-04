import { useState } from "react";

import { uploadFile } from "../../services/chat.api";

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files[0]) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const res = await uploadFile(file);
      // media-service returns { url, type, ... }
      setAttachments((prev) => [...prev, { ...res.data, originalName: file.name }]);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const send = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend({ text, attachments, mine: true, _id: Date.now() });
    setText("");
    setAttachments([]);
  };

  return (
    <div className="flex flex-col border-t">
      {attachments.length > 0 && (
        <div className="flex gap-2 p-2 overflow-x-auto">
          {attachments.map((att, i) => (
            <div key={i} className="text-xs bg-gray-100 p-1 rounded border flex items-center">
              📄 {att.originalName || "File"}
              <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-red-500 font-bold">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 flex items-center">
        <label className="cursor-pointer text-gray-500 hover:text-gray-700 mr-2 p-2">
          📎
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && !isUploading && send()}
          className="flex-1 border p-2 rounded"
          placeholder="Type a message"
          disabled={isUploading}
        />

        <button
          onClick={send}
          disabled={isUploading}
          className="ml-2 bg-green-600 text-white px-4 rounded disabled:opacity-50"
        >
          {isUploading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
