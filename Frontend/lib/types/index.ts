export type Role = "viewer" | "channel-owner" | "admin";

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  progress: number;
  rewardPoints: number;
  category: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  date: string;
  points: number;
  status: "completed" | "pending";
}

export interface DashboardStat {
  label: string;
  value: string;
  trend: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "suspended";
}

export interface ChannelApproval {
  id: string;
  channelName: string;
  owner: string;
  subscribers: number;
  status: "pending" | "approved" | "rejected";
}

export interface PayoutRequest {
  id: string;
  user: string;
  amount: number;
  requestedAt: string;
  status: "pending" | "paid" | "rejected";
}
