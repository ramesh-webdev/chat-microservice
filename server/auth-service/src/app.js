import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/", authRoutes);
app.use("/users", userRoutes)

export default app;