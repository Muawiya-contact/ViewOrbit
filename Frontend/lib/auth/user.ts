import { ROLES, type AppRole } from "@/lib/constants/roles";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
}

const allowedRoles = new Set<AppRole>([ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN]);

interface AuthUserSource {
  uid?: string;
  id?: string;
  email?: string | null;
  displayName?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  customClaims?: Record<string, unknown>;
}

export const getRoleFromUser = (user: AuthUserSource | null): AppRole => {
  if (!user) return ROLES.VIEWER;

  const roleFromAppMetadata = user.app_metadata?.role;
  const roleFromUserMetadata = user.user_metadata?.role;
  const roleFromCustomClaims = user.customClaims?.role;

  if (typeof roleFromAppMetadata === "string" && allowedRoles.has(roleFromAppMetadata as AppRole)) {
    return roleFromAppMetadata as AppRole;
  }

  if (typeof roleFromUserMetadata === "string" && allowedRoles.has(roleFromUserMetadata as AppRole)) {
    return roleFromUserMetadata as AppRole;
  }

  if (typeof roleFromCustomClaims === "string" && allowedRoles.has(roleFromCustomClaims as AppRole)) {
    return roleFromCustomClaims as AppRole;
  }

  return ROLES.VIEWER;
};

export const toAuthUser = (user: AuthUserSource | null): AuthUser | null => {
  if (!user || !user.email) return null;

  const fullNameFromMetadata = user.user_metadata?.full_name;
  const fullNameFromDisplayName = user.displayName;
  const fallbackName = user.email.split("@")[0] || "ViewOrbit User";

  return {
    id: user.uid ?? user.id ?? "",
    email: user.email,
    fullName:
      typeof fullNameFromMetadata === "string" && fullNameFromMetadata.trim().length > 0
        ? fullNameFromMetadata
        : typeof fullNameFromDisplayName === "string" && fullNameFromDisplayName.trim().length > 0
          ? fullNameFromDisplayName
          : fallbackName,
    role: getRoleFromUser(user),
  };
};
