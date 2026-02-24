export const SUPPORTED_PLATFORMS = [
  "youtube",
  "instagram",
  "facebook",
  "tiktok",
  "other",
] as const;

export type TaskPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<TaskPlatform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  other: "Other",
};

export const PLATFORM_OPTIONS = SUPPORTED_PLATFORMS.map((platform) => ({
  value: platform,
  label: PLATFORM_LABELS[platform],
}));
