
import Media from '../models/media.model.js';

export const saveMedia = async (data) => {
  const media = new Media(data);
  await media.save();
  return media;
};

export const getMediaByChat = async (chatId) => {
  return Media.find({ chatId }).sort({ createdAt: 1 });
};
