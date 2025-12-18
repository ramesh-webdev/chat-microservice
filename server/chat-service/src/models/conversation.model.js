const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const MemberSchema = new Schema({
userId: { type: Schema.Types.ObjectId, ref: 'User' },
role: { type: String, enum: ['member','admin'], default: 'member' }
}, { _id: false });


const ConversationSchema = new Schema({
type: { type: String, enum: ['private','group'], default: 'private' },
members: [MemberSchema],
title: String,
avatarUrl: String,
pinnedBy: [{ userId: Schema.Types.ObjectId, pinnedAt: Date }],
mute: [{ userId: Schema.Types.ObjectId, until: Date }]
}, { timestamps: true });


ConversationSchema.index({ 'members.userId': 1 });


module.exports = mongoose.model('Conversation', ConversationSchema);