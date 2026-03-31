import type { NextRequest } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { getAdminDb, verifyRequestUser } from "@/lib/server/firebase-admin";

export interface AdminAccessContext {
  adminId: string;
  adminEmail: string;
}

export async function requireAdminAccess(request: NextRequest): Promise<AdminAccessContext | null> {
  const legacyAdmin = await requireAdminApiAuth(request);
  if (legacyAdmin) {
    return {
      adminId: legacyAdmin.adminId,
      adminEmail: legacyAdmin.adminEmail,
    };
  }

  const decoded = await verifyRequestUser(request);
  if (!decoded) return null;

  const db = getAdminDb();
  const userSnap = await db.collection("users").doc(decoded.uid).get();
  if (!userSnap.exists) return null;

  const user = userSnap.data() as { role?: string; email?: string; status?: string };
  if (user.role !== "admin" || user.status === "disabled") {
    return null;
  }

  return {
    adminId: decoded.uid,
    adminEmail: user.email ?? decoded.email ?? "",
  };
}
