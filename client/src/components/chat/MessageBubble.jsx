import { useAuthStore } from "../../stores/auth.store";

export default function MessageBubble({ msg }) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const isMine = msg.senderId === currentUserId;

  return (
    <div className={`mb-2 ${isMine ? "text-right" : "text-left"}`}>
      <span
        className={`inline-block px-3 py-2 rounded ${
          isMine ? "bg-green-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        {msg.content}
        {isMine && (
          <span
            className={`text-xs ${
              msg.status === "read" ? "text-blue-600" : "text-white"
            } ml-1`}
          >
            {msg.status === "sending" && "⏳"}
            {msg.status === "sent" && "✓"}
            {msg.status === "delivered" && "✓✓"}
            {msg.status === "read" && "✓✓"}
          </span>
        )}
      </span>
    </div>
  );
}
