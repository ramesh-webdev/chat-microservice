import { create } from "zustand";

export const useChatStore = create((set) => ({
  /**
   * activeChat = null | {
   *   mode: "conversation" | "user",
   *   conversationId?: string,
   *   userId?: string,
   *   label: string
   * }
   */
  activeChat: null,

  setActiveChat: (chat) => set({ activeChat: chat }),

  clearChat: () => set({ activeChat: null }),
}));
