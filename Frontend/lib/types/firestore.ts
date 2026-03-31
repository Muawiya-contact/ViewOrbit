import type { Timestamp } from "firebase-admin/firestore";

export type TaskPlatform = "youtube" | "instagram" | "facebook" | "tiktok";

export interface UserDoc {
  uid: string;
  email: string;
  role: "user" | "admin";
  points: number;
  streak: number;
  status: "active";
  walletType: "JazzCash" | "EasyPaisa";
  walletNumber: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
}

export interface ChannelDoc {
  channelId: string;
  ownerUserId: string;
  youtubeChannelId: string;
  channelUrl: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export interface VideoDoc {
  videoId: string;
  creatorId: string;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  requiredViews: number;
  completedViews: number;
  requiredLikes: number;
  completedLikes: number;
  requiredComments: number;
  completedComments: number;
  createdAt?: Timestamp;
}

export interface TaskDoc {
  taskId: string;
  videoId: string;
  channelId: string;
  taskType: "view" | "like" | "subscribe" | "comment";
  rewardPoints: number;
  maxUsers: number;
  status?: "active" | "paused";
  createdAt?: Timestamp;
  createdBy?: string;
}

export interface TaskAssignmentDoc {
  assignmentId: string;
  taskId: string;
  userId: string;
  status: "assigned" | "completed";
  createdAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface CommentDoc {
  commentId: string;
  text: string;
  createdAt?: Timestamp;
  createdBy?: string;
}

export interface PayoutRequestDoc {
  payoutId: string;
  userId: string;
  amountPoints: number;
  amountPkr: number;
  method: "jazzcash" | "easypaisa";
  accountNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface SettingsDoc {
  settingsId: "default";
  pointsPerUnit: number;
  pkrPerUnit: number;
  minPayoutPoints: number;
  updatedAt?: Timestamp;
  updatedBy?: string;
}
