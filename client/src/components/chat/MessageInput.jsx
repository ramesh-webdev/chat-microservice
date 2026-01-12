import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import api from "../../services/api";
import useSocket from "../../hooks/useSocket";

export default function MessageInput({ onSend, onTyping, editingMessage, onCancelEdit }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const pickerRef = useRef(null);
  const socket = useSocket();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      setAttachments([]); // Attachments disabled for edit in this MVP
    } else {
      setText("");
    }
  }, [editingMessage]);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    setIsUploading(true);
    const files = Array.from(e.target.files);

    try {
      const promises = files.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      });

      const responses = await Promise.all(promises);
      const newAttachments = responses.map((res) => res.data);
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const send = () => {
    if ((!text.trim() && attachments.length === 0) || isUploading) return;

    if (editingMessage) {
      // Edit Mode
      socket.emit("message:edit", {
        messageId: editingMessage._id,
        newContent: text
      });
      onCancelEdit();
    } else {
      // Normal Send
      onSend({ text, attachments, mine: true, _id: Date.now() });
    }

    setText("");
    setAttachments([]);
    setShowEmojiPicker(false);
  };

  return (
    <div className={`p-4 border-t border-slate-200 relative transition-colors ${editingMessage ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200" : "bg-white dark:bg-slate-900 dark:border-slate-800"}`}>
      {/* Editing Indicator */}
      {editingMessage && (
        <div className="flex justify-between items-center mb-2 px-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <span>Editing message...</span>
          <button onClick={onCancelEdit} className="hover:underline">Cancel</button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div ref={pickerRef} className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-xl">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            autoFocusSearch={false}
            width={320}
            height={400}
            previewConfig={{ showPreview: false }}
            theme="auto"
          />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 p-2 overflow-x-auto bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          {attachments.map((att, i) => (
            <div key={i} className="text-xs bg-white text-slate-700 px-2 py-1 rounded shadow-sm flex items-center gap-2 dark:bg-slate-700 dark:text-slate-200">
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

      <div className="flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border border-transparent focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all z-10 relative dark:bg-slate-800 dark:focus-within:bg-slate-800 dark:focus-within:border-indigo-500/50 dark:focus-within:ring-indigo-900/30">
        {/* Attachment Button */}
        <label className="p-2 cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors dark:text-slate-500 dark:hover:text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        {/* Emoji Toggle Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 transition-colors ${showEmojiPicker ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && !isUploading && send()}
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 py-2 dark:text-slate-100 dark:placeholder-slate-500"
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
