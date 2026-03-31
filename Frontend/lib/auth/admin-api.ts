import { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth/admin-session";
import { getAdminDb } from "@/lib/server/firebase-admin";

export interface AdminApiContext {
  adminId: string;
  adminEmail: string;
  role: string;
}

export async function requireAdminApiAuth(request: NextRequest): Promise<AdminApiContext | null> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAdminSessionToken(token);

  if (!payload) {
    return null;
  }

  const db = getAdminDb();
  const snapshot = await db.collection("admins").doc(payload.adminId).get();
  if (!snapshot.exists) {
    return null;
  }

  const admin = snapshot.data() as {
    email?: string;
    role?: string;
    isActive?: boolean;
  };

  if ((admin.email ?? payload.email) !== payload.email) {
    return null;
  }

  if (admin.isActive === false) {
    return null;
  }

  return {
    adminId: payload.adminId,
    adminEmail: admin.email ?? payload.email,
    role: admin.role ?? "admin",
  };
}
