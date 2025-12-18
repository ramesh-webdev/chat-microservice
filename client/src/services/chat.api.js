import api from "./api";

/**
 * Fetch messages for a conversation
 * @param {string} conversationId
 * @param {string|null} cursor - messageId of the oldest loaded message
 */
export const fetchMessages = (conversationId, cursor = null) => {
  return api.get(`/chat/messages/${conversationId}`, {
    params: cursor ? { cursor } : {}
  });
};
