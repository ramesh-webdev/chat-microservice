
import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import chatRoutes from './chat.routes.js';
import mediaRoutes from './media.routes.js';
import notificationRoutes from './notification.routes.js';

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'monolith-api' }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/media', mediaRoutes);
router.use('/notify', notificationRoutes);

export default router;
