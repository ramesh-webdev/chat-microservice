import express from "express";
import { authUsers } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
const router = express.Router();

router.get("/",requireAuth, authUsers);
router.put("/me", requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name },
    { new: true }
  );

  res.json({ user });
});


export default router;