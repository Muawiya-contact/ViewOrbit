export const ROLES = {
  VIEWER: "viewer",
  CHANNEL_OWNER: "channel-owner",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
