import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth/admin-session";
import { updateSession } from "@/utils/firebase/middleware";

const PUBLIC_ROUTES = new Set<string>([
  ROUTES.LANDING,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
]);

const AUTHENTICATED_ROUTES = new Set<string>([
  ROUTES.DASHBOARD,
  ROUTES.DASHBOARD_TASKS,
  ROUTES.DASHBOARD_WALLET,
  ROUTES.DASHBOARD_PAYOUT,
  ROUTES.DASHBOARD_PROFILE,
  ROUTES.DASHBOARD_NOTIFICATIONS,
  ROUTES.HOME,
  ROUTES.REDEEM,
  ROUTES.TASKS,
  ROUTES.SUPPORT,
  ROUTES.SERVICE,
  ROUTES.VIEWER,
  ROUTES.CHANNEL_OWNER,
  ROUTES.ADMIN,
]);

const isProtectedPath = (pathname: string) => pathname.startsWith(ROUTES.DASHBOARD) || AUTHENTICATED_ROUTES.has(pathname);

const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");
const isPublicAdminPath = (pathname: string) => pathname === "/admin/login";
const isAdminApiPath = (pathname: string) => pathname.startsWith("/api/admin/");
const isPublicAdminApiPath = (pathname: string) =>
  pathname === "/api/admin/auth/login" || pathname === "/api/admin/auth/reset-password" || pathname === "/api/admin/auth/logout";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { response, user } = await updateSession(request);

  if (isAdminPath(pathname) && !isPublicAdminPath(pathname)) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const adminSession = await verifyAdminSessionToken(adminToken);

    if (!adminSession) {
      const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
      redirect.cookies.delete(ADMIN_COOKIE_NAME);
      return redirect;
    }
  }

  if (isAdminApiPath(pathname) && !isPublicAdminApiPath(pathname)) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSession = await verifyAdminSessionToken(adminToken);

    if (!adminSession) {
      const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      unauthorized.cookies.delete(ADMIN_COOKIE_NAME);
      return unauthorized;
    }
  }

  if (PUBLIC_ROUTES.has(pathname) && user) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = new URL(ROUTES.LOGIN, request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
