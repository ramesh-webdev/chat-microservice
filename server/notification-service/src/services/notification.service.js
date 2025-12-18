
import admin from '../utils/firebase.js';
import Device from '../models/device.model.js';

export const sendPush = async ({ userId, title, body, data }) => {
  const devices = await Device.find({ userId });
  const tokens = devices.map(d => d.token);
  if (!tokens.length) return;

  const message = {
    notification: { title, body },
    data,
    tokens
  };

  await admin.messaging().sendEachForMulticast(message);
};
