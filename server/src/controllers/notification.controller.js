
import User from '../models/User.js';
import { sendPush } from '../services/notification.service.js';

export const registerDevice = async (req, res) => {
    const { userId, token, platform } = req.body;

    try {
        // Logic: Add this token to the user's devices. 
        // Since we don't have deviceId from this endpoint usually, 
        // we'll try to find a device that already has this token, or create a 'mobile' device entry.

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if token exists
        let tokenExists = false;
        user.devices.forEach(d => {
            if (d.pushTokens.includes(token)) tokenExists = true;
        });

        if (!tokenExists) {
            // Add to a generic device or create one
            // We'll create a new device entry for this registration
            user.devices.push({
                deviceId: `mobile-${Date.now()}`,
                pushTokens: [token],
                lastActive: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Long expiry
            });
            await user.save();
        }

        res.json({ success: true, message: 'Device registered' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const notifyUser = async (req, res) => {
    const { userId, title, body, data } = req.body;
    await sendPush({ userId, title, body, data });
    res.json({ success: true });
};
