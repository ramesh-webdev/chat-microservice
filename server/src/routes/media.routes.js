
import express from 'express';
import { upload } from '../utils/storage.js';
import { uploadFile, fetchChatMedia } from '../controllers/media.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/upload', requireAuth, upload.single('file'), uploadFile);
router.get('/:chatId', requireAuth, fetchChatMedia);

export default router;
