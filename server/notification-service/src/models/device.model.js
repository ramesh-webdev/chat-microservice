
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  userId: String,
  token: String,
  platform: { type: String, enum: ['web','android','ios'], default: 'web' }
}, { timestamps: true });

export default mongoose.model('Device', deviceSchema);
