
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseAdmin = null; // Default null if not configured

// Initializing only if env var is present to avoid crash
if (process.env.FIREBASE_KEY) {
    try {
        const keyPath = path.resolve(process.env.FIREBASE_KEY);

        // Check if file exists
        if (fs.existsSync(keyPath)) {
            const serviceAccount = JSON.parse(
                fs.readFileSync(keyPath, "utf8")
            );

            firebaseAdmin = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase initialized");
        } else {
            console.warn(`Firebase key file not found at ${keyPath}`);
        }

    } catch (err) {
        console.error("Firebase initialization failed:", err.message);
    }
} else {
    console.warn("Firebase not configured (FIREBASE_KEY missing).");
}

export default firebaseAdmin;
