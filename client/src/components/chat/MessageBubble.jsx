import { useState } from "react";
import { useAuthStore } from "../../stores/auth.store";
import useSocket from "../../hooks/useSocket";

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function MessageBubble({ msg, isSelected, onToggleSelect, selectionMode, isGroup }) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  // Handle populated senderId (object) or raw ID (string)
  // Handle populated senderId (object) or raw ID (string)
  const senderId = msg.senderId?._id || msg.senderId;
  const isMine = String(senderId) === String(currentUserId);
  const socket = useSocket();
  const [showPicker, setShowPicker] = useState(false);

  // ... (rest same)

  const handleReaction = (emoji) => {
    socket.emit("message:reaction", {
      messageId: msg._id,
      reaction: emoji
    });
    setShowPicker(false);
  };

  return (
    <div className={`mb-4 flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative group max-w-[70%] w-fit transition-all ${isSelected ? "opacity-100" : ""}`}
        onClick={() => {
          if (selectionMode) onToggleSelect();
        }}
      >
        {/* Selection Checkbox */}
        <div
          className={`absolute top-0 bottom-0 ${isMine ? "-left-12" : "-right-12"} w-10 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${isSelected || selectionMode ? "opacity-100" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"}`}>
            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>

        {/* Reaction Picker Popover */}
        {showPicker && !selectionMode && (
          <div className={`absolute bottom-full mb-2 ${isMine ? "right-0" : "left-0"} bg-white dark:bg-slate-800 shadow-lg rounded-full border border-slate-100 dark:border-slate-700 p-1 flex gap-1 z-20 min-w-max`}>
            {REACTION_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Hover Trigger Button */}
        {!showPicker && !isMine && !selectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowPicker(true); }}
            className={`absolute -bottom-2 ${isMine ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full`}
            title="Add reaction"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 8.625a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM15.375 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 10.5a.75.75 0 00-7.5 0v.75a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75zM6 15a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 15z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <div
          className={`px-4 py-2.5 shadow-sm text-sm relative transition-all ${isMine
            ? `rounded-2xl rounded-tr-sm ${isSelected ? "bg-indigo-700 ring-2 ring-indigo-300 dark:ring-indigo-500" : "bg-indigo-600"} text-white dark:bg-indigo-600`
            : `rounded-2xl rounded-tl-sm border ${isSelected ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 dark:bg-slate-800 dark:ring-slate-600" : "bg-white border-slate-100"} text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700`
            }`}
        >
          {isGroup && !isMine && msg.senderId?.username && (
            <span className="block text-xs font-bold mb-1 text-indigo-600 dark:text-indigo-400">
              {msg.senderId.username}
            </span>
          )}
          <span className="block leading-relaxed">
            {msg.content}
            {msg.isEdited && <span className="text-[10px] opacity-60 italic ml-1">(edited)</span>}
          </span>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {msg.attachments.map((att, i) => (
                <div key={i}>
                  {att.type && att.type.startsWith("image/") ? (
                    <img
                      src={att.url}
                      alt="attachment"
                      className="max-w-xs rounded-lg border border-white/20"
                    />
                  ) : (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 text-xs p-2 rounded ${isMine ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-slate-100 text-indigo-600 hover:bg-slate-200"
                        }`}
                    >
                      <span>📎</span> {att.originalName || "File"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMine ? "text-indigo-200" : "text-slate-400"}`}>
            {isMine && (
              <span>
                {msg.status === "sending" && "⏳"}
                {msg.status === "sent" && "✓"}
                {msg.status === "delivered" && "✓✓"}
                {msg.status === "read" && <span className="text-cyan-300 font-bold">✓✓</span>}
              </span>
            )}
            {/* Timestamp could go here if available */}
          </div>

          {/* Reaction Display - Absolute positioned bottom corner? Or inline? Inline/Block below looks safer */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`absolute -bottom-3 ${isMine ? "left-0" : "right-0"} flex -space-x-1`}>
              {/* Aggregate reactions to show counts? Or just pile them? "Minimal" usually means pile or small counts. Let's pile unique emojis */}
              {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                <div key={emoji} className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-sm overflow-hidden" title={`${msg.reactions.filter(r => r.emoji === emoji).length} reaction(s)`}>
                  {emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
