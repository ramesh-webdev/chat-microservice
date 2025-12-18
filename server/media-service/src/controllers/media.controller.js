
import { saveMedia, getMediaByChat } from '../services/media.service.js';

export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const media = await saveMedia({
    url: '/uploads/' + req.file.filename,
    fileName: req.file.originalname,
    chatId: req.body.chatId,
    userId: req.body.userId,
    type: req.body.type || 'file'
  });

  res.json(media);
};

export const fetchChatMedia = async (req, res) => {
  const list = await getMediaByChat(req.params.chatId);
  res.json(list);
};
