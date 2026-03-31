import { NextRequest, NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { verifyRequestUser } from "@/lib/server/firebase-admin";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import type { AdminApiContext } from "@/lib/auth/admin-api";

export interface UserApiContext {
  token: DecodedIdToken;
  uid: string;
  email: string | null;
}

export type UserApiHandler<T> = (request: NextRequest, context: UserApiContext) => Promise<NextResponse<T> | NextResponse>;
export type AdminApiHandler<T> = (request: NextRequest, context: AdminApiContext) => Promise<NextResponse<T> | NextResponse>;

export const unauthorizedResponse = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function resolveUserApiContext(request: NextRequest): Promise<UserApiContext | null> {
  const decoded = await verifyRequestUser(request);
  if (!decoded) {
    return null;
  }

  return {
    token: decoded,
    uid: decoded.uid,
    email: decoded.email ?? null,
  };
}

export function withUserApiAuth<T>(handler: UserApiHandler<T>) {
  return async (request: NextRequest): Promise<NextResponse<T> | NextResponse> => {
    const context = await resolveUserApiContext(request);
    if (!context) {
      return unauthorizedResponse();
    }

    return handler(request, context);
  };
}

export function withAdminApiAuth<T>(handler: AdminApiHandler<T>) {
  return async (request: NextRequest): Promise<NextResponse<T> | NextResponse> => {
    const context = await requireAdminApiAuth(request);
    if (!context) {
      return unauthorizedResponse();
    }

    return handler(request, context);
  };
}
