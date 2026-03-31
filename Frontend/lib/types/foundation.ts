export interface WalletData {
  userId: string;
  points: number;
  lifetimeEarned: number;
  updatedAt: string;
}

export interface NotificationData {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  platform: string;
  rewardPoints: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProfileData {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
}
