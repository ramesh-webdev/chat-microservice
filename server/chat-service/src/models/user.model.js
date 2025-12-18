const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DeviceSchema = new Schema({
deviceId: String,
pushTokens: [String],
lastActive: Date,
}, { _id: false });


const UserSchema = new Schema({
phone: { type: String, required: true, unique: true },
name: { type: String },
avatarUrl: String,
status: String,
devices: [DeviceSchema],
blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);