import { jwtVerify, SignJWT } from "jose";
import type { JWTPayload } from "jose";

export interface AdminSessionPayload extends JWTPayload {
  adminId: string;
  email: string;
}

const ADMIN_COOKIE_NAME = "vo_admin_session";

const getSessionSecret = () => {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "vieworbit-dev-admin-secret";
};

const getSecretKey = () => new TextEncoder().encode(getSessionSecret());

export async function createAdminSessionToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminId)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const adminId = typeof payload.adminId === "string" ? payload.adminId : "";
    const email = typeof payload.email === "string" ? payload.email : "";

    if (!adminId || !email) {
      return null;
    }

    return { adminId, email };
  } catch {
    return null;
  }
}

export { ADMIN_COOKIE_NAME };
