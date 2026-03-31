import { CircleHelp, Home, ListChecks, Wallet, type LucideIcon } from "lucide-react";
import { ROLES, type AppRole } from "@/lib/constants/roles";

export const ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  DASHBOARD_TASKS: "/tasks",
  DASHBOARD_WALLET: "/wallet",
  DASHBOARD_PAYOUT: "/payout",
  DASHBOARD_PROFILE: "/profile",
  DASHBOARD_NOTIFICATIONS: "/notifications",
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
  [ROLES.VIEWER]: ROUTES.DASHBOARD,
  [ROLES.CHANNEL_OWNER]: ROUTES.DASHBOARD,
  [ROLES.ADMIN]: ROUTES.DASHBOARD,
};

export const DASHBOARD_ROUTE_ROLES: Record<string, AppRole[]> = {
  [ROUTES.DASHBOARD]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.DASHBOARD_TASKS]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.DASHBOARD_WALLET]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.DASHBOARD_PAYOUT]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.DASHBOARD_PROFILE]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
  [ROUTES.DASHBOARD_NOTIFICATIONS]: [ROLES.VIEWER, ROLES.CHANNEL_OWNER, ROLES.ADMIN],
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
