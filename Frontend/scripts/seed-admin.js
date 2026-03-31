#!/usr/bin/env node

/**
 * Seed Admin Data Script (Firebase)
 * Creates initial admin account in Firebase Auth + Firestore.
 *
 * Usage:
 *   node scripts/seed-admin.js
 */

import * as dotenv from "dotenv";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Load environment variables from .env.local
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

const auth = getAuth(app);
const db = getFirestore(app);

async function seedAdmin() {
  console.log("🌱 Seeding admin account...\n");

  try {
    // Admin credentials for testing
    const adminEmail = "admin@test.local";
    const adminPassword = "Temp@Admin123";
    const adminName = "Test Administrator";

    // Check if admin already exists
    console.log("📋 Checking if admin already exists...");
    let existingUser = null;
    try {
      existingUser = await auth.getUserByEmail(adminEmail);
    } catch {
      existingUser = null;
    }

    if (existingUser) {
      console.log("⚠️  Admin already exists at:", adminEmail);
      await auth.updateUser(existingUser.uid, {
        password: adminPassword,
        displayName: adminName,
      });
      await db.collection("admins").doc(existingUser.uid).set(
        {
          adminId: existingUser.uid,
          email: adminEmail,
          fullName: adminName,
          role: "super_admin",
          active: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      console.log("   ✓ Password refreshed and admin record ensured\n");
      return;
    }

    console.log("   ✓ No existing admin found");

    // Create Firebase Auth user + Firestore admin profile
    console.log("➕ Creating admin account...");
    const createdUser = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminName,
      emailVerified: true,
    });

    await db.collection("admins").doc(createdUser.uid).set({
      adminId: createdUser.uid,
      email: adminEmail,
      fullName: adminName,
      role: "super_admin",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin created successfully!\n");
    console.log("📝 Admin Details:");
    console.log("   ID:", createdUser.uid);
    console.log("   Email:", adminEmail);
    console.log("   Name:", adminName);
    console.log("\n🔑 Login Credentials:");
    console.log("   Email:", adminEmail);
    console.log("   Password:", adminPassword);
    console.log("\n🌐 Access Admin Panel:");
    console.log("   URL: http://localhost:3000/admin/login");
    console.log("\n⚠️  IMPORTANT:");
    console.log("   • Change this password in production");
    console.log("   • Store credentials safely\n");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});

export { seedAdmin };
