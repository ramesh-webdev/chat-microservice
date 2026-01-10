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
    <div className="bg-white p-4 border-t border-slate-200">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 p-2 overflow-x-auto bg-slate-50 rounded-lg border border-slate-100">
          {attachments.map((att, i) => (
            <div key={i} className="text-xs bg-white text-slate-700 px-2 py-1 rounded shadow-sm flex items-center gap-2">
              <span>📄 {att.originalName || "File"}</span>
              <button
                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border border-transparent focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <label className="p-2 cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && !isUploading && send()}
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 py-2"
          placeholder="Type a message..."
          disabled={isUploading}
        />

        <button
          onClick={send}
          disabled={isUploading || (!text.trim() && attachments.length === 0)}
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isUploading ? (
            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
