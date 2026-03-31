import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { getAdminAuth } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);

  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const newPassword = String(body.newPassword ?? "");

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    await getAdminAuth().updateUser(adminContext.adminId, {
      password: newPassword,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin.auth.reset-password] POST failed", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
