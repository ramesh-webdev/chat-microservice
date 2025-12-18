import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../stores/auth.store";

let socket;

export default function useSocket() {
  const token = useAuthStore((s) => s.token);
  const initialized = useRef(false);

  useEffect(() => {
    if (!token || initialized.current) return;

    socket = io(import.meta.env.VITE_CHAT_SOCKET_URL || "http://localhost:5001", {
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
  

    initialized.current = true;

    return () => {
      socket?.disconnect();
      socket = null;
      initialized.current = false;
    };
  }, [token]);

  return socket;
}
