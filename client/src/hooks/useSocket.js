import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../stores/auth.store";

let socket;

export default function useSocket() {
  const token = useAuthStore((s) => s.token);
  const initialized = useRef(false);

  useEffect(() => {
    if (!socket) {
      socket = io(import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000", {
        auth: { token },
        transports: ["websocket"],
      });

      // 🔹 CONNECTION SUCCESS
      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
      });

      // 🔹 CONNECTION ERROR (auth / CORS / server down)
      socket.on("connect_error", (err) => {
        console.error("❌ Socket connect error:", err.message);
      });

      // 🔹 DISCONNECTED
      socket.on("disconnect", (reason) => {
        console.warn("⚠️ Socket disconnected:", reason);
      });

      // 🔹 RECONNECTING
      socket.io.on("reconnect_attempt", (attempt) => {
        console.log("🔄 Reconnecting... attempt", attempt);
      });
    }

    return () => {
      // Do NOT disconnect here because this hook is used in many components (like MessageBubble).
      // If one component unmounts, it would kill the connection for everyone.
      // The socket should stay alive as long as the token is valid.
    };
  }, [token]);

  return socket;
}
