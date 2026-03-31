import type { Timestamp } from "firebase-admin/firestore";

export type TaskType = "view" | "like" | "subscribe" | "comment";

export interface TaskModel {
  taskId: string;
  videoId: string;
  videoUrl: string;
  channelId: string;
  taskType: TaskType;
  rewardPoints: number;
  maxUsers: number;
  assignedUsersCount: number;
  status: "active" | "completed";
  createdAt?: Timestamp;
  createdBy: string;
}

export interface TaskAssignmentModel {
  assignmentId: string;
  taskId: string;
  userId: string;
  status: "assigned" | "completed" | "skipped";
  proof?: string;
  createdAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface RedemptionModel {
  redeemId: string;
  userId: string;
  pointsUsed: number;
  pkrAmount: number;
  walletType: "JazzCash" | "EasyPaisa";
  walletNumber: string;
  status: "pending" | "processing" | "paid" | "rejected";
  createdAt?: Timestamp;
  processedAt?: Timestamp;
}
