
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: String,
  fileName: String,
  chatId: String,
  userId: String,
  type: { type: String, enum: ['image','video','audio','file'], default: 'file' }
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);
