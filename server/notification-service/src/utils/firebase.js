import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseAdmin = null;

if (process.env.FIREBASE_KEY) {
  try {
    const keyPath = path.resolve(process.env.FIREBASE_KEY);

    const serviceAccount = JSON.parse(
      fs.readFileSync(keyPath, "utf8")
    );

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase initialized");
  } catch (err) {
    console.error("Firebase initialization failed:", err.message);
  }
} else {
  console.warn("Firebase not configured. Skipping initialization.");
}

export default firebaseAdmin;
