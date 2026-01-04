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

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type);
  return api.post("/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const createGroupConversation = (title, members) => {
  return api.post("/chat/conversations/group", { title, members });
};

export const searchUsers = (query) => {
  return api.get("/users", { params: { search: query } });
};
