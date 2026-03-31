"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Flame } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/client/fetch-with-auth";

interface UserStats {
  points: number;
  streak: number;
}

interface AssignedTask {
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

const CHANNEL_URL = "https://www.youtube.com/@Coding_Moves";
const DEFAULT_COMMENTS = [
  "Great content!",
  "Very informative video!",
  "Loved this explanation!",
] as const;

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number>;
        },
      ) => {
        getDuration: () => number;
        getCurrentTime: () => number;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function calculateStreakFromLastActive(lastActiveRaw: unknown): number {
  if (!lastActiveRaw) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let lastActiveDate: Date | null = null;

  if (
    typeof lastActiveRaw === "object" &&
    lastActiveRaw !== null &&
    "toDate" in lastActiveRaw &&
    typeof (lastActiveRaw as { toDate?: () => Date }).toDate === "function"
  ) {
    lastActiveDate = (lastActiveRaw as { toDate: () => Date }).toDate();
  } else if (lastActiveRaw instanceof Date) {
    lastActiveDate = lastActiveRaw;
  } else if (typeof lastActiveRaw === "string") {
    const parsed = new Date(lastActiveRaw);
    lastActiveDate = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!lastActiveDate) return 0;

  const normalizedLastActive = new Date(
    lastActiveDate.getFullYear(),
    lastActiveDate.getMonth(),
    lastActiveDate.getDate(),
  );

  const diffDays = Math.floor((today.getTime() - normalizedLastActive.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 0;
  if (diffDays <= 1) return 1;
  return 0;
}

function useUserStats(uid?: string) {
  const [stats, setStats] = useState<UserStats>({ points: 0, streak: 0 });

  useEffect(() => {
    if (!uid) {
      setStats({ points: 0, streak: 0 });
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        const data = snapshot.data() as { points?: number; lastActive?: unknown } | undefined;

        setStats({
          points: Number(data?.points ?? 0),
          streak: calculateStreakFromLastActive(data?.lastActive),
        });
      },
      (error) => {
        console.error("[dashboard] failed to subscribe user stats", error);
        setStats({ points: 0, streak: 0 });
      },
    );

    return () => unsubscribe();
  }, [uid]);

  return stats;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuthContext();
  const userStats = useUserStats(user?.uid);

  const [task, setTask] = useState<AssignedTask | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [completedVideosCount, setCompletedVideosCount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string>(DEFAULT_COMMENTS[0]);
  const [message, setMessage] = useState<string>("");

  const playerRef = useRef<{ getDuration: () => number; getCurrentTime: () => number; destroy: () => void } | null>(null);
  const watchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncedProgressRef = useRef<number>(0);
  const rewardingTaskRef = useRef<string | null>(null);

  const applyTask = useCallback((nextTask: AssignedTask | null) => {
    setTask(nextTask);
    if (nextTask) {
      lastSyncedProgressRef.current = nextTask.watchProgress ?? 0;
      if (nextTask.predefinedComment?.trim()) {
        setSelectedComment(nextTask.predefinedComment.trim());
      }
    }
  }, []);

  const assignTask = useCallback(
    async (useNext: boolean) => {
      if (!user || saving) return;

      setSaving(true);
      setMessage("");

      try {
        const response = await fetchWithAuth("/api/tasks", {
          method: useNext ? "POST" : "GET",
          maxRetries: 2,
        });

        const payload = (await response.json()) as { task?: AssignedTask; error?: string };

        if (!response.ok || !payload.task) {
          if (response.status === 404) {
            setMessage("No eligible videos available right now.");
            return;
          }
          if (response.status === 401 || response.status === 403) {
            setMessage("Session expired. Please login again.");
            return;
          }
          throw new Error(payload.error ?? "No task available");
        }

        applyTask(payload.task);
      } catch {
        // Keep console noise low for expected API misses; show user-friendly message.
        console.warn("[dashboard] assign task unavailable");
        setMessage("No eligible videos available right now.");
      } finally {
        setSaving(false);
      }
    },
    [applyTask, saving, user],
  );

  const patchTaskProgress = useCallback(
    async (input: {
      watchProgress?: number;
      likeCompleted?: boolean;
      commentCompleted?: boolean;
      subscribeCompleted?: boolean;
      commentText?: string;
    }) => {
      if (!task || !user) return;

      try {
        const response = await fetchWithAuth("/api/tasks", {
          method: "PATCH",
          maxRetries: 2,
          body: JSON.stringify({
            taskId: task.taskId,
            ...input,
          }),
        });

        const payload = (await response.json()) as { task?: AssignedTask; error?: string };
        if (!response.ok || !payload.task) {
          throw new Error(payload.error ?? "Task update failed");
        }

        applyTask(payload.task);
      } catch (error) {
        console.error("[dashboard] patch task progress failed", error);
      }
    },
    [applyTask, task, user],
  );

  const claimReward = useCallback(async () => {
    if (!task || !user || !task.completed) return;
    if (rewardingTaskRef.current === task.taskId) return;

    rewardingTaskRef.current = task.taskId;

    try {
      const response = await fetchWithAuth("/api/tasks/complete", {
        method: "POST",
        maxRetries: 2,
        body: JSON.stringify({ taskId: task.taskId }),
      });

      const payload = (await response.json()) as {
        pointsAwarded?: number;
        alreadyRewarded?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Reward failed");
      }

      if (payload.alreadyRewarded) {
        setMessage("Task was already rewarded.");
      } else {
        setMessage(`Task Completed - You earned ${payload.pointsAwarded ?? 0} points!`);
      }
    } catch (error) {
      console.error("[dashboard] claim reward failed", error);
      setMessage("Task complete, but reward could not be processed now.");
    }
  }, [task, user]);

  const openVideo = useCallback((videoId?: string) => {
    if (!videoId) return;
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
  }, []);

  const allTasksCompleted = useMemo(() => {
    if (!task) return false;
    return (
      (!task.watchRequired || task.watchCompleted) &&
      (!task.likeRequired || task.likeCompleted) &&
      (!task.commentRequired || task.commentCompleted) &&
      (!task.subscribeRequired || task.subscribeCompleted)
    );
  }, [task]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const data = snapshot.data() as {
        earnedPoints?: number;
        completedVideos?: unknown;
      } | undefined;

      setEarnedPoints(Number(data?.earnedPoints ?? 0));

      const completedVideos = Array.isArray(data?.completedVideos)
        ? data?.completedVideos.filter((value): value is string => typeof value === "string")
        : [];
      setCompletedVideosCount(completedVideos.length);
    });

    return () => unsubscribe();
  }, [profile?.points, user]);

  useEffect(() => {
    if (loading || !user) return;
    if (!task) {
      void assignTask(false);
    }
  }, [assignTask, loading, task, user]);

  useEffect(() => {
    if (!task?.taskId) return;

    const unsubscribe = onSnapshot(doc(db, "taskAssignments", task.taskId), (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data() as {
        taskId?: string;
        videoId?: string;
        watchCompleted?: boolean;
        likeCompleted?: boolean;
        commentCompleted?: boolean;
        watchRequired?: boolean;
        likeRequired?: boolean;
        commentRequired?: boolean;
          subscribeRequired?: boolean;
          subscribeCompleted?: boolean;
          taskType?: "view" | "like" | "subscribe" | "comment";
          channelId?: string;
          commentText?: string;
        rewardPoints?: number;
        watchProgress?: number;
      };

      setTask((prev) => {
        if (!prev) return prev;

        const next: AssignedTask = {
          ...prev,
          taskId: data.taskId ?? prev.taskId,
          videoId: data.videoId ?? prev.videoId,
          taskType: data.taskType ?? prev.taskType,
          channelId: data.channelId ?? prev.channelId,
          predefinedComment: data.commentText ?? prev.predefinedComment,
          watchCompleted: Boolean(data.watchCompleted),
          likeCompleted: Boolean(data.likeCompleted),
          commentCompleted: Boolean(data.commentCompleted),
          subscribeCompleted: Boolean(data.subscribeCompleted),
          watchRequired: Boolean(data.watchRequired ?? true),
          likeRequired: Boolean(data.likeRequired ?? true),
          commentRequired: Boolean(data.commentRequired ?? true),
          subscribeRequired: Boolean(data.subscribeRequired ?? false),
          rewardPoints: Number(data.rewardPoints ?? prev.rewardPoints),
          watchProgress: Number(data.watchProgress ?? prev.watchProgress ?? 0),
          completed:
            (!Boolean(data.watchRequired ?? true) || Boolean(data.watchCompleted)) &&
            (!Boolean(data.likeRequired ?? true) || Boolean(data.likeCompleted)) &&
            (!Boolean(data.commentRequired ?? true) || Boolean(data.commentCompleted)) &&
            (!Boolean(data.subscribeRequired ?? false) || Boolean(data.subscribeCompleted)),
        };

        lastSyncedProgressRef.current = Math.max(
          lastSyncedProgressRef.current,
          next.watchProgress,
        );

        return next;
      });
    });

    return () => unsubscribe();
  }, [task?.taskId]);

  useEffect(() => {
    if (!task?.youtubeVideoId) return;

    const loadPlayer = () => {
      if (!window.YT?.Player || !task?.youtubeVideoId) return;

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: task.youtubeVideoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
        },
      });
    };

    if (window.YT?.Player) {
      loadPlayer();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = loadPlayer;
    }

    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }

    watchIntervalRef.current = setInterval(() => {
      if (!playerRef.current || !task || task.watchCompleted) return;

      try {
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        if (duration <= 0) return;

        const progress = Math.min(100, Math.round((currentTime / duration) * 100));
        const shouldSync = progress >= 70 || progress - lastSyncedProgressRef.current >= 10;

        if (shouldSync) {
          lastSyncedProgressRef.current = progress;
          void patchTaskProgress({ watchProgress: progress });
        }
      } catch {
      }
    }, 1000);

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
    };
  }, [patchTaskProgress, task]);

  useEffect(() => {
    if (allTasksCompleted) {
      void claimReward();
    }
  }, [allTasksCompleted, claimReward]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleLike = () => {
    if (!task) return;
    openVideo(task.youtubeVideoId);
    void patchTaskProgress({ likeCompleted: true });
  };

  const handleDislike = () => {
    if (!task) return;
    openVideo(task.youtubeVideoId);
    setMessage("Dislike selected. Reward requires Like + Watch + Comment.");
  };

  const handleComment = async () => {
    if (!task) return;

    try {
      await navigator.clipboard.writeText(selectedComment);
    } catch {
    }

    openVideo(task.youtubeVideoId);
    void patchTaskProgress({
      commentCompleted: true,
      commentText: selectedComment,
    });
  };

  const handleSubscribe = () => {
    if (!task) return;
    const channelTarget = task.channelId
      ? `https://www.youtube.com/channel/${task.channelId}`
      : CHANNEL_URL;
    window.open(channelTarget, "_blank", "noopener,noreferrer");
    void patchTaskProgress({ subscribeCompleted: true });
  };

  const handleNextVideo = () => {
    rewardingTaskRef.current = null;
    void assignTask(true);
  };

  if (loading || !user) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">{userStats.points}</span>
            <span className="text-xs text-amber-800/80">Points</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold">{userStats.streak}</span>
            <span className="text-xs text-orange-800/80">Streak</span>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-2 rounded border border-gray-300 p-4">
        <p><strong>Username:</strong> {profile?.username ?? "-"}</p>
        <p><strong>Email:</strong> {profile?.email ?? user.email ?? "-"}</p>
        <p><strong>Current Points:</strong> {userStats.points}</p>
        <p><strong>Completed Videos:</strong> {completedVideosCount}</p>
      </div>

      <div className="mb-6 rounded border border-gray-300 p-4">
        <h2 className="mb-3 text-lg font-semibold">Assigned Video Task</h2>
        {task?.youtubeVideoId ? (
          <>
            <p className="mb-2 text-sm text-gray-700">{task.title}</p>
            <p className="mb-2 text-xs text-gray-500">
              Task type: {task.taskType ?? "view"}
            </p>
            <div className="aspect-video w-full overflow-hidden rounded border border-gray-300">
              <div id="youtube-player" className="h-full w-full" />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Assigning a random video...</p>
        )}
      </div>

      <div className="mb-6 rounded border border-gray-300 p-4">
        <h3 className="mb-3 text-base font-semibold">Checklist</h3>
        <ul className="space-y-2 text-sm">
          {task?.watchRequired ? <li>{task?.watchCompleted ? "✔" : "⬜"} Watch 70% of the video</li> : null}
          {task?.likeRequired ? <li>{task?.likeCompleted ? "✔" : "⬜"} Like the video</li> : null}
          {task?.commentRequired ? <li>{task?.commentCompleted ? "✔" : "⬜"} Comment on the video</li> : null}
          {task?.subscribeRequired ? <li>{task?.subscribeCompleted ? "✔" : "⬜"} Subscribe to channel</li> : null}
        </ul>

        <p className="mt-3 text-xs text-gray-500">
          Watch progress: {Math.min(100, Math.round(task?.watchProgress ?? 0))}%
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={handleLike}
            disabled={!task || !task.likeRequired || task.likeCompleted}
          >
            Like
          </button>
          <button
            type="button"
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white"
            onClick={handleDislike}
            disabled={!task}
          >
            Dislike
          </button>
          <button
            type="button"
            className="rounded bg-zinc-800 px-3 py-2 text-sm text-white"
            onClick={() => window.open(CHANNEL_URL, "_blank", "noopener,noreferrer")}
          >
            Open Channel
          </button>
          <button
            type="button"
            className="rounded bg-indigo-700 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={handleSubscribe}
            disabled={!task || !task.subscribeRequired || task.subscribeCompleted}
          >
            Subscribe
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="comment-template" className="block text-sm font-medium text-gray-700">Choose a comment</label>
          <select
            id="comment-template"
            value={selectedComment}
            onChange={(event) => setSelectedComment(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {DEFAULT_COMMENTS.map((comment) => (
              <option key={comment} value={comment}>{comment}</option>
            ))}
          </select>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={handleComment}
            disabled={!task || !task.commentRequired || task.commentCompleted}
          >
            Copy Comment + Open Video
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded bg-gray-700 px-4 py-2 text-white"
          onClick={handleLogout}
        >
          Logout
        </button>
        <button
          type="button"
          className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          onClick={handleNextVideo}
          disabled={!task || !task.completed || saving}
        >
          Next Video
        </button>
      </div>

      <p className="mt-4 text-sm text-green-600">{message}</p>
      <p className="mt-2 text-xs text-gray-500">Total earned from task rewards: {earnedPoints}</p>
    </main>
  );
}
