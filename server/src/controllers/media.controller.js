
import Media from '../models/Media.js';

export const uploadFile = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const media = await Media.create({
            url: '/uploads/' + req.file.filename,
            fileName: req.file.originalname,
            chatId: req.body.chatId,
            userId: req.body.userId,
            type: req.body.type || 'file'
        });

        res.json(media);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const fetchChatMedia = async (req, res) => {
    try {
        const list = await Media.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
