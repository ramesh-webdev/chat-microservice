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
            name: 1
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