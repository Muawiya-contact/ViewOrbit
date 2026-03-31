// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocFromCache,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid?: string;
  userId?: string;
  username?: string;
  email: string;
  points: number;
  walletType?: "JazzCash" | "EasyPaisa";
  walletNumber?: string;
  createdAt?: Timestamp;
  assignedVideoId?: string;
  assignedVideoUrl?: string;
  completedVideoIds?: string[];
  completedVideos?: string[];
  watchHistory?: string[];
  reputationScore?: number;
  completedTasks?: {
    watch70: boolean;
    like: boolean;
    comment: boolean;
    subscribe: boolean;
  };
  earnedPoints?: number;
}

interface CreateUserProfilePayload {
  uid: string;
  email: string;
  walletType: "JazzCash" | "EasyPaisa";
  walletNumber: string;
}

const toUserProfile = (data: UserProfile): UserProfile => ({
  userId: data.userId,
  uid: data.uid ?? data.userId,
  email: data.email,
  points: data.points ?? 0,
  walletType: data.walletType,
  walletNumber: data.walletNumber,
  completedVideos: data.completedVideos ?? data.completedVideoIds ?? [],
  completedVideoIds: data.completedVideoIds ?? data.completedVideos ?? [],
  watchHistory: data.watchHistory ?? [],
  reputationScore: data.reputationScore ?? 100,
  completedTasks: data.completedTasks,
  assignedVideoId: data.assignedVideoId,
  assignedVideoUrl: data.assignedVideoUrl,
  earnedPoints: data.earnedPoints ?? 0,
  createdAt: data.createdAt,
});

const isExpectedOfflineError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("client is offline") ||
    message.includes("failed to get document from cache") ||
    message.includes("network")
  );
};

export async function createUserProfileDoc({
  uid,
  email,
  walletType,
  walletNumber,
}: CreateUserProfilePayload): Promise<void> {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      role: "user",
      walletType,
      walletNumber,
      points: 10,
      streak: 0,
      status: "active",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error("[auth] createUserProfileDoc failed", error);
    throw error;
  }
}

export async function registerUser(
  email: string,
  password: string,
  walletType: "JazzCash" | "EasyPaisa",
  walletNumber: string,
) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await createUserProfileDoc({
      uid: credential.user.uid,
      email,
      walletType,
      walletNumber,
    });

    return credential.user;
  } catch (error) {
    console.error("[auth] registerUser failed", error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    console.error("[auth] loginUser failed", error);
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);

  try {
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      return null;
    }

    return toUserProfile(snapshot.data() as UserProfile);
  } catch (error) {
    if (!isExpectedOfflineError(error)) {
      console.error("[auth] getUserProfile getDoc failed", error);
    }

    try {
      const cachedSnapshot = await getDocFromCache(ref);

      if (!cachedSnapshot.exists()) {
        return null;
      }

      return toUserProfile(cachedSnapshot.data() as UserProfile);
    } catch (cacheError) {
      if (!isExpectedOfflineError(cacheError)) {
        console.error("[auth] getUserProfile cache read failed", cacheError);
      }
      return null;
    }
  }
}