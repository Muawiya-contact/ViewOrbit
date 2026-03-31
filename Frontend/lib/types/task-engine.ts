import type { Timestamp } from "firebase/firestore";

export interface UserMarketplaceProfile {
  userId: string;
  email: string;
  points: number;
  completedVideos: string[];
  watchHistory: string[];
  reputationScore: number;
  createdAt?: Timestamp;
  lastTaskDay?: string;
  tasksCompletedToday?: number;
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
  assignedUserId: string;
  watchRequired: boolean;
  likeRequired: boolean;
  commentRequired: boolean;
  watchCompleted: boolean;
  likeCompleted: boolean;
  commentCompleted: boolean;
  rewardPoints: number;
  createdAt?: Timestamp;
  watchProgress?: number;
  rewardGranted?: boolean;
  completedAt?: Timestamp;
  commentText?: string;
  assignedDay?: string;
}

export interface TransactionDoc {
  transactionId: string;
  userId: string;
  type: "task_reward" | "creator_debit" | "platform_margin";
  amount: number;
  source: string;
  timestamp?: Timestamp;
}

export interface AssignedTaskResponse {
  taskId: string;
  videoId: string;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  taskType?: "view" | "like" | "subscribe" | "comment";
  channelId?: string;
  predefinedComment?: string;
  rewardPoints: number;
  watchCompleted: boolean;
  likeCompleted: boolean;
  commentCompleted: boolean;
  subscribeCompleted?: boolean;
  watchRequired: boolean;
  likeRequired: boolean;
  commentRequired: boolean;
  subscribeRequired?: boolean;
  watchProgress: number;
  completed: boolean;
}
