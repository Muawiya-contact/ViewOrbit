import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import type { AssignedTaskResponse } from "@/lib/types/task-engine";

const DEFAULT_REWARD_POINTS = 10;
const MAX_TASKS_PER_DAY = 20;
const CHANNEL_URL = "https://www.youtube.com/@Coding_Moves";

const TASK_TYPES = ["view", "like", "subscribe", "comment"] as const;
type TaskType = (typeof TASK_TYPES)[number];

function normalizeTaskType(value: unknown): TaskType {
  const raw = String(value ?? "").toLowerCase();
  if (TASK_TYPES.includes(raw as TaskType)) return raw as TaskType;
  if (raw === "youtube") return "view";
  return "view";
}

function parseYouTubeVideoId(input: unknown): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  // If it's already a plain ID-like string (no URL).
  if (!raw.includes("/") && !raw.includes("?") && raw.length >= 8 && raw.length <= 30) {
    return raw;
  }

  // Common URL patterns.
  const vParam = raw.match(/[?&]v=([^?&]+)/i)?.[1];
  if (vParam) return vParam;

  const youtuBe = raw.match(/youtu\.be\/([^?&/]+)/i)?.[1];
  if (youtuBe) return youtuBe;

  const embed = raw.match(/\/embed\/([^?&/]+)/i)?.[1];
  if (embed) return embed;

  return null;
}

async function pickRandomVideoFromVideosCollection(): Promise<{
  videoId: string;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
} | null> {
  const db = getAdminDb();

  // Fallback for environments where tasks are stored without videoId.
  const snapshot = await db.collection("videos").limit(50).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[Math.floor(Math.random() * snapshot.docs.length)];
  const data = doc.data() as {
    videoId?: string;
    youtubeVideoId?: string;
    title?: string;
    thumbnail?: string;
  };

  const videoId = parseYouTubeVideoId(data.videoId ?? doc.id) ?? "";
  if (!videoId) return null;

  const youtubeVideoId = parseYouTubeVideoId(data.youtubeVideoId ?? videoId) ?? videoId;
  return {
    videoId,
    youtubeVideoId,
    title: String(data.title ?? "YouTube Video"),
    thumbnail: String(
      data.thumbnail ?? `https://i.ytimg.com/vi/${youtubeVideoId}/mqdefault.jpg`,
    ),
  };
}

interface AssignmentResult {
  taskRefId: string;
  task: {
    taskType?: "view" | "like" | "subscribe" | "comment";
    channelId?: string;
    predefinedComment?: string;
    videoId: string;
    watchRequired: boolean;
    likeRequired: boolean;
    commentRequired: boolean;
    subscribeRequired?: boolean;
    watchCompleted: boolean;
    likeCompleted: boolean;
    commentCompleted: boolean;
    subscribeCompleted?: boolean;
    rewardPoints: number;
    watchProgress: number;
  };
  video: {
    youtubeVideoId: string;
    title: string;
    thumbnail: string;
  };
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const safeArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export async function ensureUserProfile(uid: string, email: string | null): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const snapshot = await userRef.get();

  if (snapshot.exists) return;

  await userRef.set({
    uid,
    email: email ?? "",
    role: "user",
    walletType: "JazzCash",
    walletNumber: "",
    points: 10,
    streak: 0,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    lastLogin: FieldValue.serverTimestamp(),
    lastTaskDay: todayKey(),
    tasksCompletedToday: 0,
  });
}

function toAssignedTaskResponse(result: AssignmentResult): AssignedTaskResponse {
  const completed =
    (!result.task.watchRequired || result.task.watchCompleted) &&
    (!result.task.likeRequired || result.task.likeCompleted) &&
    (!result.task.commentRequired || result.task.commentCompleted) &&
    (!result.task.subscribeRequired || Boolean(result.task.subscribeCompleted));

  return {
    taskId: result.taskRefId,
    videoId: result.task.videoId,
    youtubeVideoId: result.video.youtubeVideoId,
    title: result.video.title,
    thumbnail: result.video.thumbnail,
    taskType: result.task.taskType,
    channelId: result.task.channelId,
    predefinedComment: result.task.predefinedComment,
    rewardPoints: result.task.rewardPoints,
    watchCompleted: result.task.watchCompleted,
    likeCompleted: result.task.likeCompleted,
    commentCompleted: result.task.commentCompleted,
    subscribeCompleted: result.task.subscribeCompleted,
    watchRequired: result.task.watchRequired,
    likeRequired: result.task.likeRequired,
    commentRequired: result.task.commentRequired,
    subscribeRequired: result.task.subscribeRequired,
    watchProgress: result.task.watchProgress,
    completed,
  };
}

export async function assignTaskForUser(uid: string): Promise<AssignedTaskResponse | null> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const today = todayKey();

  const userSnapshot = await userRef.get();
  const userData = (userSnapshot.data() ?? {}) as {
    completedVideos?: unknown;
    lastTaskDay?: string;
    tasksCompletedToday?: number;
  };

  const lastTaskDay = userData.lastTaskDay ?? today;
  const tasksCompletedToday = Number(userData.tasksCompletedToday ?? 0);
  const normalizedTodayCount = lastTaskDay === today ? tasksCompletedToday : 0;

  if (normalizedTodayCount >= MAX_TASKS_PER_DAY) {
    return null;
  }

  const existingSnapshot = await db
    .collection("taskAssignments")
    .where("userId", "==", uid)
    .where("status", "==", "assigned")
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const taskDoc = existingSnapshot.docs[0];
    const taskData = taskDoc.data() as {
      videoId?: string;
      taskId?: string;
      taskType?: "view" | "like" | "subscribe" | "comment";
      channelId?: string;
      commentText?: string;
      watchRequired?: boolean;
      likeRequired?: boolean;
      commentRequired?: boolean;
      subscribeRequired?: boolean;
      watchCompleted?: boolean;
      likeCompleted?: boolean;
      commentCompleted?: boolean;
      subscribeCompleted?: boolean;
      rewardPoints?: number;
      watchProgress?: number;
    };
    const taskDefinition = await db.collection("tasks").doc(String(taskData.taskId ?? "")).get();
    const task = taskDefinition.data() as {
      videoId?: string;
      youtubeVideoId?: string;
      videoUrl?: string;
      rewardPoints?: number;
      taskType?: string;
    };

    const resolvedVideoId =
      parseYouTubeVideoId(task.videoId) ??
      parseYouTubeVideoId(task.youtubeVideoId) ??
      parseYouTubeVideoId(task.videoUrl) ??
      parseYouTubeVideoId(taskData.videoId) ??
      "";

    const resolvedVideo =
      resolvedVideoId
        ? {
            videoId: resolvedVideoId,
            youtubeVideoId: resolvedVideoId,
            title: "YouTube Task",
            thumbnail: `https://i.ytimg.com/vi/${resolvedVideoId}/mqdefault.jpg`,
          }
        : await pickRandomVideoFromVideosCollection();

    if (!resolvedVideo) {
      return null;
    }

    return toAssignedTaskResponse({
      taskRefId: taskDoc.id,
      task: {
        videoId: resolvedVideo.videoId,
        taskType: taskData.taskType,
        channelId: taskData.channelId,
        predefinedComment: taskData.commentText,
        watchRequired: Boolean(taskData.watchRequired),
        likeRequired: Boolean(taskData.likeRequired),
        commentRequired: Boolean(taskData.commentRequired),
        subscribeRequired: Boolean(taskData.subscribeRequired),
        watchCompleted: Boolean(taskData.watchCompleted),
        likeCompleted: Boolean(taskData.likeCompleted),
        commentCompleted: Boolean(taskData.commentCompleted),
        subscribeCompleted: Boolean(taskData.subscribeCompleted),
        rewardPoints: Number(taskData.rewardPoints ?? DEFAULT_REWARD_POINTS),
        watchProgress: Number(taskData.watchProgress ?? 0),
      },
      video: {
        youtubeVideoId: resolvedVideo.youtubeVideoId,
        title: resolvedVideo.title,
        thumbnail: resolvedVideo.thumbnail,
      },
    });
  }

  const availableTasksSnapshot = await db
    .collection("tasks")
    .where("status", "in", ["active", "available"])
    .limit(100)
    .get();

  let selectedTask: {
    id: string;
    videoId: string;
    taskType: TaskType;
    rewardPoints: number;
    channelId?: string;
  } | null = null;

  const shuffledTasks = [...availableTasksSnapshot.docs].sort(() => Math.random() - 0.5);

  for (const doc of shuffledTasks) {
    const data = doc.data() as {
      videoId?: string;
      youtubeVideoId?: string;
      videoUrl?: string;
      channelId?: string;
      creatorId?: string;
      channelUrl?: string;
      taskType?: string;
      platform?: string;
      rewardPoints?: number;
      maxUsers?: number;
      dailyCap?: number;
    };

    const maxUsers = Number(data.maxUsers ?? data.dailyCap ?? 0);
    if (maxUsers <= 0) continue;

    const countSnap = await db
      .collection("taskAssignments")
      .where("taskId", "==", doc.id)
      .limit(maxUsers + 1)
      .get();

    if (countSnap.size >= maxUsers) continue;

    const derivedTaskType = normalizeTaskType(data.taskType ?? data.platform);

    const derivedVideoId =
      parseYouTubeVideoId(data.videoId) ??
      parseYouTubeVideoId(data.youtubeVideoId) ??
      parseYouTubeVideoId(data.videoUrl) ??
      parseYouTubeVideoId(doc.id) ??
      "";

    selectedTask = {
      id: doc.id,
      videoId: derivedVideoId,
      channelId: String(data.channelId ?? data.creatorId ?? ""),
      taskType: derivedTaskType,
      rewardPoints: Number(data.rewardPoints ?? DEFAULT_REWARD_POINTS),
    };
    break;
  }

  if (!selectedTask) return null;

  const resolvedVideo =
    selectedTask.videoId
      ? {
          videoId: selectedTask.videoId,
          youtubeVideoId: selectedTask.videoId,
          title: "YouTube Task",
          thumbnail: `https://i.ytimg.com/vi/${selectedTask.videoId}/mqdefault.jpg`,
        }
      : await pickRandomVideoFromVideosCollection();

  if (!resolvedVideo) return null;

  const taskRef = db.collection("taskAssignments").doc();
  const requiresComment = selectedTask.taskType === "comment";
  let commentText = "";
  if (requiresComment) {
    const commentsSnap = await db.collection("comments").limit(50).get();
    const pool = commentsSnap.docs
      .map((doc) => (doc.data() as { text?: string }).text ?? "")
      .filter((text) => text.trim().length > 0);
    if (pool.length > 0) {
      commentText = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  await taskRef.set({
    assignmentId: taskRef.id,
    taskId: selectedTask.id,
    userId: uid,
    status: "assigned",
    rewardPoints: selectedTask.rewardPoints,
    createdAt: FieldValue.serverTimestamp(),
    assignedDay: today,
    taskType: selectedTask.taskType,
    videoId: resolvedVideo.videoId,
    channelId: selectedTask.channelId ?? "",
    commentText,
    watchRequired: selectedTask.taskType === "view",
    likeRequired: selectedTask.taskType === "like",
    commentRequired: selectedTask.taskType === "comment",
    subscribeRequired: selectedTask.taskType === "subscribe",
    watchCompleted: false,
    likeCompleted: false,
    commentCompleted: false,
    subscribeCompleted: false,
    watchProgress: 0,
    rewardGranted: false,
    channelUrl: CHANNEL_URL,
  });

  await userRef.set(
    {
      lastTaskDay: today,
      tasksCompletedToday: normalizedTodayCount,
    },
    { merge: true },
  );

  return toAssignedTaskResponse({
    taskRefId: taskRef.id,
    task: {
      videoId: resolvedVideo.videoId,
      taskType: selectedTask.taskType,
      channelId: selectedTask.channelId,
      predefinedComment: commentText,
      watchRequired: selectedTask.taskType === "view",
      likeRequired: selectedTask.taskType === "like",
      commentRequired: selectedTask.taskType === "comment",
      subscribeRequired: selectedTask.taskType === "subscribe",
      watchCompleted: false,
      likeCompleted: false,
      commentCompleted: false,
      subscribeCompleted: false,
      rewardPoints: selectedTask.rewardPoints,
      watchProgress: 0,
    },
    video: {
      youtubeVideoId: resolvedVideo.youtubeVideoId,
      title: resolvedVideo.title,
      thumbnail: resolvedVideo.thumbnail,
    },
  });
}

export async function updateTaskProgress(params: {
  uid: string;
  taskId: string;
  watchProgress?: number;
  likeCompleted?: boolean;
  commentCompleted?: boolean;
  subscribeCompleted?: boolean;
  commentText?: string;
}): Promise<AssignedTaskResponse | null> {
  const db = getAdminDb();
  const taskRef = db.collection("taskAssignments").doc(params.taskId);

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(taskRef);
    if (!snapshot.exists) return null;

    const data = snapshot.data() as {
      userId: string;
      videoId: string;
      watchCompleted?: boolean;
      likeCompleted?: boolean;
      commentCompleted?: boolean;
      subscribeCompleted?: boolean;
      watchProgress?: number;
      rewardPoints?: number;
      watchRequired?: boolean;
      likeRequired?: boolean;
      commentRequired?: boolean;
      subscribeRequired?: boolean;
    };

    if (data.userId !== params.uid) {
      throw new Error("Forbidden");
    }

    const nextWatchProgress = Math.max(
      Number(data.watchProgress ?? 0),
      Number(params.watchProgress ?? 0),
    );

    const updates: Record<string, unknown> = {
      watchProgress: Math.min(100, nextWatchProgress),
      status: "in_progress",
    };

    const watchCompleted = Boolean(data.watchCompleted) || nextWatchProgress >= 70;
    const likeCompleted = Boolean(data.likeCompleted) || Boolean(params.likeCompleted);
    const commentCompleted = Boolean(data.commentCompleted) || Boolean(params.commentCompleted);
    const subscribeCompleted = Boolean(data.subscribeCompleted) || Boolean(params.subscribeCompleted);

    updates.watchCompleted = watchCompleted;
    updates.likeCompleted = likeCompleted;
    updates.commentCompleted = commentCompleted;
    updates.subscribeCompleted = subscribeCompleted;

    if (params.commentText && params.commentText.trim()) {
      updates.commentText = params.commentText.trim().slice(0, 250);
    }

    const doneByRequirement =
      (!data.watchRequired || watchCompleted) &&
      (!data.likeRequired || likeCompleted) &&
      (!data.commentRequired || commentCompleted) &&
      (!data.subscribeRequired || subscribeCompleted);

    if (doneByRequirement) {
      updates.status = "pending_review";
    }

    transaction.update(taskRef, updates);

    return {
      taskRefId: snapshot.id,
      task: {
        videoId: data.videoId,
        taskType: normalizeTaskType(
          data.watchRequired
            ? "view"
            : data.likeRequired
              ? "like"
              : data.commentRequired
                ? "comment"
                : "subscribe",
        ),
        watchRequired: Boolean(data.watchRequired ?? true),
        likeRequired: Boolean(data.likeRequired ?? true),
        commentRequired: Boolean(data.commentRequired ?? true),
        subscribeRequired: Boolean(data.subscribeRequired ?? false),
        watchCompleted,
        likeCompleted,
        commentCompleted,
        subscribeCompleted,
        rewardPoints: Number(data.rewardPoints ?? DEFAULT_REWARD_POINTS),
        watchProgress: Math.min(100, nextWatchProgress),
      },
    };
  });

  if (!result) {
    return null;
  }

  const videoSnapshot = await db.collection("videos").doc(result.task.videoId).get();
  const videoData = (videoSnapshot.data() ?? {}) as {
    youtubeVideoId?: string;
    title?: string;
    thumbnail?: string;
  };

  return toAssignedTaskResponse({
    taskRefId: result.taskRefId,
    task: result.task,
    video: {
      youtubeVideoId: videoData.youtubeVideoId ?? result.task.videoId,
      title: videoData.title ?? "YouTube Video",
      thumbnail: videoData.thumbnail ?? `https://i.ytimg.com/vi/${result.task.videoId}/mqdefault.jpg`,
    },
  });
}

export async function completeTaskAndReward(uid: string, taskId: string): Promise<{ pointsAwarded: number; alreadyRewarded: boolean }> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const taskRef = db.collection("taskAssignments").doc(taskId);
  const txRef = db.collection("transactions").doc(randomUUID());
  const today = todayKey();

  return db.runTransaction(async (transaction) => {
    const [userSnap, taskSnap] = await Promise.all([transaction.get(userRef), transaction.get(taskRef)]);

    if (!taskSnap.exists) {
      throw new Error("Task not found");
    }

    const taskData = taskSnap.data() as {
      userId: string;
      videoId: string;
      rewardPoints?: number;
      rewardGranted?: boolean;
      watchRequired?: boolean;
      likeRequired?: boolean;
      commentRequired?: boolean;
      subscribeRequired?: boolean;
      watchCompleted?: boolean;
      likeCompleted?: boolean;
      commentCompleted?: boolean;
      subscribeCompleted?: boolean;
    };

    if (taskData.userId !== uid) {
      throw new Error("Forbidden");
    }

    const allDone = Boolean(
      (!taskData.watchRequired || taskData.watchCompleted) &&
      (!taskData.likeRequired || taskData.likeCompleted) &&
      (!taskData.commentRequired || taskData.commentCompleted) &&
      (!taskData.subscribeRequired || taskData.subscribeCompleted),
    );
    if (!allDone) {
      throw new Error("Task is not complete");
    }

    const userData = (userSnap.data() ?? {}) as {
      points?: number;
      completedVideos?: unknown;
      watchHistory?: unknown;
      tasksCompletedToday?: number;
      lastTaskDay?: string;
    };

    const completedVideos = safeArray(userData.completedVideos);
    const watchHistory = safeArray(userData.watchHistory);
    const alreadyRewarded = Boolean(taskData.rewardGranted) || completedVideos.includes(taskData.videoId);

    if (alreadyRewarded) {
      transaction.update(taskRef, {
        rewardGranted: true,
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
      return { pointsAwarded: 0, alreadyRewarded: true };
    }

    const reward = Number(taskData.rewardPoints ?? DEFAULT_REWARD_POINTS);
    const currentPoints = Number(userData.points ?? 0);
    const dayCount = userData.lastTaskDay === today ? Number(userData.tasksCompletedToday ?? 0) : 0;

    transaction.update(userRef, {
      points: currentPoints + reward,
      completedVideos: Array.from(new Set([...completedVideos, taskData.videoId])),
      watchHistory: Array.from(new Set([...watchHistory, taskData.videoId])),
      lastTaskDay: today,
      tasksCompletedToday: dayCount + 1,
    });

    transaction.update(taskRef, {
      rewardGranted: true,
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
    });

    const videoRef = db.collection("videos").doc(taskData.videoId);
    transaction.set(
      videoRef,
      {
        completedViews: FieldValue.increment(1),
        completedLikes: FieldValue.increment(1),
        completedComments: FieldValue.increment(1),
      },
      { merge: true },
    );

    transaction.set(txRef, {
      transactionId: txRef.id,
      userId: uid,
      type: "task_reward",
      amount: reward,
      source: taskData.videoId,
      timestamp: Timestamp.now(),
    });

    return { pointsAwarded: reward, alreadyRewarded: false };
  });
}
