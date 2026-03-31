import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebase-admin";

export interface AdminSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

interface FirebasePasswordSignInResult {
  localId: string;
  email: string;
}

const getFirebaseWebApiKey = (): string => {
  const key =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    process.env.FIREBASE_WEB_API_KEY ??
    "AIzaSyDiltw87wSwNE6-4hrPPU4-PTnWEg9HI6o";

  return key;
};

async function verifyFirebasePassword(email: string, password: string): Promise<FirebasePasswordSignInResult | null> {
  const apiKey = getFirebaseWebApiKey();
  if (!apiKey) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    localId?: string;
    email?: string;
  };

  if (!payload.localId || !payload.email) {
    return null;
  }

  return {
    localId: payload.localId,
    email: payload.email,
  };
}

function toIsoDate(value: unknown): string {
  if (!value) return new Date().toISOString();

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date().toISOString();
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const authResult = await verifyFirebasePassword(email, password);
  if (!authResult) {
    return null;
  }

  const db = getAdminDb();
  const adminRef = db.collection("admins").doc(authResult.localId);
  const snapshot = await adminRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const adminData = snapshot.data() as {
    email?: string;
    role?: string;
    fullName?: string;
    isActive?: boolean;
    createdAt?: unknown;
  };

  const isActive = adminData.isActive !== false;
  if (!isActive) {
    return null;
  }

  await adminRef.set(
    {
      lastLoginAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    id: authResult.localId,
    email: adminData.email ?? authResult.email,
    fullName: adminData.fullName ?? authResult.email.split("@")[0] ?? "Admin",
    role: adminData.role ?? "admin",
    createdAt: toIsoDate(adminData.createdAt),
    isActive,
  };
}

export async function getAdminById(adminId: string): Promise<AdminSession | null> {
  const db = getAdminDb();
  const snapshot = await db.collection("admins").doc(adminId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as {
    email?: string;
    role?: string;
    fullName?: string;
    isActive?: boolean;
    createdAt?: unknown;
  };

  const userRecord = await getAdminAuth().getUser(adminId).catch(() => null);
  const resolvedEmail = data.email ?? userRecord?.email ?? "";

  return {
    id: adminId,
    email: resolvedEmail,
    fullName: data.fullName ?? resolvedEmail.split("@")[0] ?? "Admin",
    role: data.role ?? "admin",
    createdAt: toIsoDate(data.createdAt),
    isActive: data.isActive !== false,
  };
}

export async function changeAdminPassword(
  adminId: string,
  _currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  try {
    await getAdminAuth().updateUser(adminId, { password: newPassword });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update password",
    };
  }
}

export async function createAdmin(
  email: string,
  fullName: string,
  createdByAdminId: string,
): Promise<{ admin?: AdminSession; temporaryPassword?: string; error?: string }> {
  try {
    const createdBy = await getAdminById(createdByAdminId);
    if (!createdBy) {
      return { error: "Unauthorized" };
    }

    const temporaryPassword = `Admin@${Math.random().toString().slice(2, 10)}`;
    const userRecord = await getAdminAuth().createUser({
      email,
      password: temporaryPassword,
      displayName: fullName,
    });

    const db = getAdminDb();
    await db.collection("admins").doc(userRecord.uid).set({
      adminId: userRecord.uid,
      email,
      role: "admin",
      fullName,
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      createdBy: createdByAdminId,
    });

    return {
      admin: {
        id: userRecord.uid,
        email,
        fullName,
        role: "admin",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      temporaryPassword,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create admin",
    };
  }
}

export async function resetAdminPassword(adminId: string, resetByAdminId: string) {
  const resetBy = await getAdminById(resetByAdminId);
  if (!resetBy) {
    return { error: "Unauthorized" };
  }

  const temporaryPassword = `Temp@${Math.random().toString().slice(2, 10)}`;

  try {
    await getAdminAuth().updateUser(adminId, { password: temporaryPassword });
    return { temporaryPassword };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}
