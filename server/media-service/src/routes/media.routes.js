
import express from 'express';
import { upload } from '../utils/storage.js';
import { uploadFile, fetchChatMedia } from '../controllers/media.controller.js';

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);
router.get('/:chatId', fetchChatMedia);

export default router;
