/**
 * POST /api/admin/auth/login
 * Authenticates admin with email and password
 */

import { authenticateAdmin } from '@/lib/auth/admin';
import { ADMIN_COOKIE_NAME, createAdminSessionToken } from '@/lib/auth/admin-session';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
    });

    const response = NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
