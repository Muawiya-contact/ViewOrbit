import { cookies } from "next/headers";
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";
import { FIREBASE_AUTH_COOKIE_NAME } from "@/lib/auth/firebase-session";

const ADMIN_APP_NAME = "vieworbit-admin";

const buildCredential = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return undefined;
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
};

const getAdminApp = (): App => {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) {
    return existing;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const credential = buildCredential();

  if (credential) {
    return initializeApp({ credential, projectId }, ADMIN_APP_NAME);
  }

  // For local development, token verification can still work with projectId only,
  // while Firestore writes still require ADC or service account credentials.
  if (projectId) {
    return initializeApp({ projectId }, ADMIN_APP_NAME);
  }

  return initializeApp({}, ADMIN_APP_NAME);
};

export const getAdminAuth = () => getAuth(getAdminApp());
let firestoreConfigured = false;

export const getAdminDb = () => {
  const db = getFirestore(getAdminApp());

  // Use REST transport in dev to avoid gRPC/OpenSSL metadata plugin crashes
  // seen on some Windows environments.
  if (!firestoreConfigured) {
    try {
      db.settings({ preferRest: true });
    } catch {
      // Ignore if settings were already initialized.
    } finally {
      firestoreConfigured = true;
    }
  }

  return db;
};

const getTokenFromRequest = (request: NextRequest): string | null => {
  // Prefer Authorization header so clients can send fresh ID tokens.
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  // Fallback to cookie for browser navigation / legacy clients.
  const cookieToken = request.cookies.get(FIREBASE_AUTH_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  return null;
};

export const verifyRequestUser = async (request: NextRequest): Promise<DecodedIdToken | null> => {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (error) {
    // Token expiry is expected during client-side refresh; keep logs quieter.
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("id token has expired")) {
      console.error("[firebase-admin] verifyRequestUser failed", error);
    }
    return null;
  }
};

export const verifyCookieUser = async (): Promise<DecodedIdToken | null> => {
  const token = (await cookies()).get(FIREBASE_AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (error) {
    console.error("[firebase-admin] verifyCookieUser failed", error);
    return null;
  }
};
