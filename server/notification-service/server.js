
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import notificationRoutes from './src/routes/notification.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/notify', notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Notification DB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log('Notification service running on', PORT));
