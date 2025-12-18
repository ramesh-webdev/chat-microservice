import express from "express";
import { authUsers } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/",requireAuth, authUsers);

export default router;