
import admin from '../utils/firebase.js';
import User from '../models/User.js';

export const sendPush = async ({ userId, title, body, data }) => {
    if (!admin) return; // Skip if firebase not init

    const user = await User.findById(userId);
    if (!user || !user.devices) return;

    // Collect all tokens from all devices
    const tokens = user.devices.reduce((acc, device) => {
        if (device.pushTokens && Array.isArray(device.pushTokens)) {
            return acc.concat(device.pushTokens);
        }
        return acc;
    }, []);

    if (!tokens.length) return;

    // Deduplicate
    const uniqueTokens = [...new Set(tokens)];

    const message = {
        notification: { title, body },
        data: data || {},
        tokens: uniqueTokens
    };

    try {
        await admin.messaging().sendEachForMulticast(message);
    } catch (e) {
        console.error("Error sending push:", e);
    }
};
