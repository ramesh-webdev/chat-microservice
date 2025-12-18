
import Device from '../models/device.model.js';
import { sendPush } from '../services/notification.service.js';

export const registerDevice = async (req, res) => {
  const { userId, token, platform } = req.body;
  const device = await Device.create({ userId, token, platform });
  res.json(device);
};

export const notifyUser = async (req, res) => {
  const { userId, title, body, data } = req.body;
  await sendPush({ userId, title, body, data });
  res.json({ success: true });
};
