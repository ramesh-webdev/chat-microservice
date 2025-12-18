
import express from 'express';
import { registerDevice, notifyUser } from '../controllers/notification.controller.js';

const router = express.Router();

router.post('/register-device', registerDevice);
router.post('/send', notifyUser);

export default router;
