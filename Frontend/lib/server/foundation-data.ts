import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import type {
  NotificationData,
  ProfileData,
  TaskData,
  WalletData,
} from "@/lib/types/foundation";
import { getAdminDb, verifyCookieUser } from "@/lib/server/firebase-admin";

interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export async function requireAuthenticatedUser() {
  const user = await verifyCookieUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return {
    user: {
      id: user.uid,
      email: user.email ?? null,
    } as AuthenticatedUser,
  };
}

export async function getWalletForUser(userId: string): Promise<WalletData | null> {
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }

  const data = userDoc.data() as {
    points?: number;
    earnedPoints?: number;
    updatedAt?: { toDate?: () => Date };
  };

  return {
    userId,
    points: Number(data.points ?? 0),
    lifetimeEarned: Number(data.earnedPoints ?? data.points ?? 0),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("notifications")
    .where("userId", "==", userId)
    .where("isRead", "==", false)
    .get();

  return snapshot.size;
}

export async function getNotificationsForUser(userId: string): Promise<NotificationData[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("notifications").where("userId", "==", userId).get();

  return snapshot.docs
    .map((doc) => {
      const notification = doc.data() as {
        type?: string;
        message?: string;
        isRead?: boolean;
        createdAt?: { toDate?: () => Date };
      };

      return {
        id: doc.id,
        type: notification.type ?? "system",
        message: notification.message ?? "",
        isRead: Boolean(notification.isRead),
        createdAt: notification.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getActiveTasks(): Promise<TaskData[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("tasks").where("isActive", "==", true).get();

  return snapshot.docs
    .map((doc) => {
      const task = doc.data() as {
        title?: string;
        description?: string;
        platform?: string;
        rewardPoints?: number;
        isActive?: boolean;
        createdAt?: { toDate?: () => Date };
      };

      return {
        id: doc.id,
        title: task.title ?? "Untitled Task",
        description: task.description ?? "",
        platform: task.platform ?? "youtube",
        rewardPoints: Number(task.rewardPoints ?? 0),
        isActive: Boolean(task.isActive),
        createdAt: task.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getProfileForUser(userId: string): Promise<ProfileData | null> {
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }

  const profile = userDoc.data() as {
    email?: string;
    username?: string;
    createdAt?: { toDate?: () => Date };
  };

  return {
    id: userId,
    email: profile.email ?? "",
    fullName: profile.username ?? null,
    createdAt: profile.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}
