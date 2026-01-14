
import express from 'express';
import { authUsers, updateUserProfile } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, authUsers);
router.put('/me', requireAuth, updateUserProfile);

export default router;
