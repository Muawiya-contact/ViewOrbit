import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/firebase-admin";
import { createUserProfile } from "@/lib/server/services/user-service";
import type { WalletType } from "@/lib/types/user";

interface SignupBody {
  email?: string;
  password?: string;
  walletType?: WalletType;
  walletNumber?: string;
}

const isWalletType = (value: unknown): value is WalletType =>
  value === "JazzCash" || value === "EasyPaisa";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const walletType = body.walletType;
    const walletNumber = String(body.walletNumber ?? "").trim();

    if (!email || !password || !isWalletType(walletType) || !walletNumber) {
      return NextResponse.json(
        { error: "email, password, walletType and walletNumber are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await getAdminAuth().createUser({ email, password });

    await createUserProfile({
      uid: user.uid,
      email,
      walletType,
      walletNumber,
      role: "user",
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: user.uid,
          email,
          role: "user",
          walletType,
          walletNumber,
          points: 10,
          streak: 0,
          status: "active",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[auth.signup] POST failed", error);
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }
}
