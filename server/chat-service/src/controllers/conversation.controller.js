const Conversation = require('../models/conversation.model');

exports.createGroup = async (req, res) => {
    try {
        const { title, members } = req.body;
        const adminId = req.user.id;

        if (!title || !members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ message: 'Title and members are required' });
        }

        // Format members: Add admin + selected users (Deduplicated)
        const allMemberIds = new Set([adminId.toString(), ...members.map(String)]);
        const conversationMembers = Array.from(allMemberIds).map(id => ({ userId: id, role: id === adminId.toString() ? 'admin' : 'member' }));

        const conversation = await Conversation.create({
            type: 'group',
            title,
            members: conversationMembers,
        });

        // Notify members via socket? (Optional for now, client can pull/socket will broadcast if we emit)
        // For now just return the created group
        res.status(201).json(conversation);

    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({
            "members.userId": userId
        }).sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
