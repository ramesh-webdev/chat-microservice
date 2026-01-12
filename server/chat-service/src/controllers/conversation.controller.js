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
        const mongoose = require('mongoose');
        const Message = require('../models/message.model');

        // 1. Get all conversations
        const conversations = await Conversation.find({
            "members.userId": userId
        }).sort({ updatedAt: -1 }).lean();

        if (conversations.length === 0) {
            return res.json({ conversations: [] });
        }

        const conversationIds = conversations.map(c => c._id);

        // 2. Aggregate unread counts
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: conversationIds },
                    senderId: { $ne: new mongoose.Types.ObjectId(userId) } // Exclude own messages
                }
            },
            {
                $lookup: {
                    from: "messagestatuses", // Collection name for MessageStatus
                    localField: "_id",
                    foreignField: "messageId",
                    pipeline: [
                        { $match: { userId: new mongoose.Types.ObjectId(userId) } } // Only filter relevant status
                    ],
                    as: "statusDoc"
                }
            },
            { $unwind: "$statusDoc" },
            {
                $match: {
                    "statusDoc.status": { $ne: "read" } // Only unread
                }
            },
            {
                $group: {
                    _id: "$conversationId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Merge unread counts
        const countMap = {};
        unreadCounts.forEach(c => { countMap[c._id.toString()] = c.count });

        // 4. Aggregate last message
        const lastMessages = await Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$content" } // only need content for preview
                }
            }
        ]);

        const lastMessageMap = {};
        lastMessages.forEach(m => { lastMessageMap[m._id.toString()] = m.lastMessage });

        const result = conversations.map(c => ({
            ...c,
            unreadCount: countMap[c._id.toString()] || 0,
            lastMessage: lastMessageMap[c._id.toString()] || ""
        }));

        res.json({ conversations: result });
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
