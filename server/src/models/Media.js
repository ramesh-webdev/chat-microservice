
import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
    url: String,
    fileName: String,
    chatId: String,
    userId: String,
    type: { type: String, default: 'file' }
}, { timestamps: true });

export default mongoose.model('Media', MediaSchema);
