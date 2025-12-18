
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import mediaRoutes from './src/routes/media.routes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/media', mediaRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Media DB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log('Media service running on', PORT));
