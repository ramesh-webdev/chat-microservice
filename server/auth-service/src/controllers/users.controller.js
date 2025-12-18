import User from "../models/User.js";

export const authUsers = async (req, res) => {
    const currentUserId = req.user.userId;

    const users = await User.find({
        _id: {
            $ne: currentUserId
        }
    }, {
        phone: 1
    }).limit(100);

    res.json({
        users
    });
}