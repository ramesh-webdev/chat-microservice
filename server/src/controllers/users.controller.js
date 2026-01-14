
import User from "../models/User.js";

export const authUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const users = await User.find({
            _id: {
                $ne: currentUserId
            }
        }, {
            phone: 1,
            name: 1,
            avatarUrl: 1,
            status: 1
        }).limit(500);

        res.json({
            users
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name: req.body.name },
            { new: true }
        );

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
