import { NextRequest, NextResponse } from "next/server";
import { getAdminById } from "@/lib/auth/admin";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ admin: null }, { status: 200 });
  }

  const payload = await verifyAdminSessionToken(token);
  if (!payload) {
    const response = NextResponse.json({ admin: null }, { status: 200 });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  }

  const admin = await getAdminById(payload.adminId);
  if (!admin) {
    const response = NextResponse.json({ admin: null }, { status: 200 });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    },
  });
}
