import { CircleHelp, Home, ListChecks, Wallet, type LucideIcon } from "lucide-react";
import { ROLES, type AppRole } from "@/lib/constants/roles";

export const ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  HOME: "/home",
  REDEEM: "/redeem",
  TASKS: "/tasks",
  SUPPORT: "/support",
  SERVICE: "/service",
  VIEWER: "/viewer",
  CHANNEL_OWNER: "/channel-owner",
  ADMIN: "/admin",
} as const;

export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
  [ROLES.VIEWER]: ROUTES.HOME,
  [ROLES.CHANNEL_OWNER]: ROUTES.HOME,
  [ROLES.ADMIN]: ROUTES.HOME,
};

export const DASHBOARD_ROUTE_ROLES: Record<string, AppRole[]> = {
  [ROUTES.HOME]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.REDEEM]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.TASKS]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.SUPPORT]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.SERVICE]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.VIEWER]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.CHANNEL_OWNER]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.ADMIN]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
};

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
}

export const DASHBOARD_NAV_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: ROUTES.HOME,
    icon: Home,
    roles: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  },
  {
    label: "Redeem",
    href: ROUTES.REDEEM,
    icon: Wallet,
    roles: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  },
  {
    label: "Tasks",
    href: ROUTES.TASKS,
    icon: ListChecks,
    roles: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  },
  {
    label: "Support",
    href: ROUTES.SUPPORT,
    icon: CircleHelp,
    roles: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  },
];
