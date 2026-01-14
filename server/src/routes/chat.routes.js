
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createGroup, getConversations } from '../controllers/conversation.controller.js';
import { getMessages } from '../controllers/message.controller.js';

const router = express.Router();

// Conversations
router.get('/conversations', requireAuth, getConversations);
router.post('/conversations/group', requireAuth, createGroup);

// Messages
router.get('/messages/:conversationId', requireAuth, getMessages);

export default router;
