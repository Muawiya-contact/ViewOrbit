import { type NextRequest, NextResponse } from "next/server";
import { FIREBASE_AUTH_COOKIE_NAME } from "@/lib/auth/firebase-session";

interface FirebaseMiddlewareUser {
  id: string;
}

const decodeUserIdFromToken = (token: string | undefined): FirebaseMiddlewareUser | null => {
  if (!token) return null;

  const tokenParts = token.split(".");
  if (tokenParts.length < 2) return null;

  try {
    const payloadSegment = tokenParts[1];
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payloadJson = Buffer.from(padded, "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson) as { sub?: string };

    if (!payload.sub) return null;

    return { id: payload.sub };
  } catch {
    return null;
  }
};

export const updateSession = async (
  request: NextRequest,
): Promise<{ response: NextResponse; user: FirebaseMiddlewareUser | null }> => {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const token = request.cookies.get(FIREBASE_AUTH_COOKIE_NAME)?.value;
  const user = decodeUserIdFromToken(token);

  return { response, user };
};
