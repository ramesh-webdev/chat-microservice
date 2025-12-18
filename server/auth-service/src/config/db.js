
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected (Auth Service)"))
  .catch((err) => console.log("MongoDB Error", err));
