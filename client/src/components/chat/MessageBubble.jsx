import { useAuthStore } from "../../stores/auth.store";

export default function MessageBubble({ msg }) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const isMine = msg.senderId === currentUserId;

  return (
    <div className={`mb-2 ${isMine ? "text-right" : "text-left"}`}>
      <span
        className={`inline-block px-3 py-2 rounded ${isMine ? "bg-green-500 text-white" : "bg-gray-200 text-black"
          }`}
      >
        {msg.content}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.attachments.map((att, i) => (
              <div key={i}>
                {att.type && att.type.startsWith("image/") ? (
                  <img
                    src={att.url}
                    alt="attachment"
                    className="max-w-xs rounded border"
                  />
                ) : (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm underline text-blue-600 bg-white p-1 rounded"
                  >
                    📎 {att.originalName || "File"}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {isMine && (
          <span className="text-xs ml-1 block text-right mt-1 opacity-70">
            {msg.status === "sending" && "⏳"}
            {msg.status === "sent" && "✓"}
            {msg.status === "delivered" && "✓✓"}
            {msg.status === "read" && <span className="text-blue-600">✓✓</span>}
          </span>
        )}
      </span>
    </div>
  );
}
