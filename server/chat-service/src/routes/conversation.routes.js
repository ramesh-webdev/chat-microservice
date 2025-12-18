const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const Conversation = require('../models/conversation.model');


router.post('/', auth, async (req,res)=>{
const { type='private', members=[], title } = req.body;
const conv = new Conversation({ type, members, title });
await conv.save();
res.json({ conversation: conv });
});


router.get('/', auth, async (req,res)=>{
const userId = req.user.id;

const convs = await Conversation.find({ 'members.userId': userId }).sort({ updatedAt: -1 });

res.json({ conversations: convs });
});


module.exports = router;