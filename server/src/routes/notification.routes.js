
import express from 'express';
import { registerDevice, notifyUser } from '../controllers/notification.controller.js';
// No auth middleware on register? Originally it didn't seem to have one in snippet, but usually we need auth.
// The snippet had: `import { registerDevice ... }` `router.post...`
// I will keep it open as per original, or add auth if safe. 
// Safest is to keep logic as is but `registerDevice` takes userId in body. 
// If I require Auth, I can trust req.user.id. Use unsafe for now to match exactly.

const router = express.Router();

router.post('/register-device', registerDevice);
router.post('/send', notifyUser);

export default router;
