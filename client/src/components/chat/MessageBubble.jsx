import { useAuthStore } from "../../stores/auth.store";

export default function MessageBubble({ msg }) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const isMine = msg.senderId === currentUserId;

  return (
    <div className={`mb-4 flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] px-4 py-2.5 shadow-sm text-sm ${isMine
            ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
            : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-100"
          }`}
      >
        <span className="block leading-relaxed">
          {msg.content}
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
              {msg.status === "read" && "✓✓"}
            </span>
          )}
          {/* Timestamp could go here if available */}
        </div>
      </div>
    </div>
  );
}
