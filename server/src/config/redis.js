
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

export const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
    if (!redis.isOpen) {
        await redis.connect();
        console.log("Redis Connected");
    }
})();
