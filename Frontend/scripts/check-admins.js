#!/usr/bin/env node

import * as dotenv from "dotenv";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config({ path: ".env.local" });

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n",
);

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("❌ Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }),
    });

const db = getFirestore(app);

async function checkAdmins() {
  try {
    console.log("\n1️⃣ Reading admins collection...");
    const snapshot = await db.collection("admins").get();

    console.log("✅ Admins collection is reachable");
    console.log("Current count:", snapshot.size);

    console.log("\n2️⃣ Listing all admins:");
    if (snapshot.empty) {
      console.log("⚠️  No admins found");
      return;
    }

    snapshot.docs.forEach((doc) => {
      const admin = doc.data();
      console.log(
        `  - ${admin.email ?? "unknown"} (${admin.fullName ?? "N/A"}) - Active: ${admin.active ?? true}`,
      );
    });
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

checkAdmins();
