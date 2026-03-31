import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/firebase-admin";
import { markUserLastLogin } from "@/lib/server/services/user-service";

interface LoginBody {
  email?: string;
  password?: string;
}

interface FirebaseSignInResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  expiresIn: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Firebase API key is not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const payload = (await response.json()) as FirebaseSignInResponse;
    const decoded = await getAdminAuth().verifyIdToken(payload.idToken);
    await markUserLastLogin(decoded.uid);

    return NextResponse.json({
      success: true,
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
      uid: decoded.uid,
      email: payload.email,
      expiresIn: Number(payload.expiresIn),
    });
  } catch (error) {
    console.error("[auth.login] POST failed", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
