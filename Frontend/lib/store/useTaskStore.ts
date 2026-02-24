"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isLocalMode, debugLog } from "@/lib/config/env";

export type TaskPlatform = "youtube" | "instagram" | "tiktok";
export type TaskLifecycleStatus = "available" | "in-progress" | "pending" | "approved" | "rejected";

export interface TaskItem {
  id: string;
  platform: TaskPlatform;
  title: string;
  condition: "Watch at least 70%";
  reward: number;
  status: TaskLifecycleStatus;
  progress: number;
  proof?: string;
  userId: string;
}

interface TaskState {
  tasks: TaskItem[];
  startTask: (taskId: string, userId: string) => { success: boolean; message: string };
  updateTaskProgress: (taskId: string, nextProgress: number) => { success: boolean; message: string };
  submitTaskProof: (taskId: string, proof: string) => { success: boolean; message: string };
  setTaskStatus: (taskId: string, status: TaskLifecycleStatus) => void;
}

const seedTasks: TaskItem[] = [
  {
    id: "task-youtube-1",
    platform: "youtube",
    title: "Watch at least 70% of the product launch video",
    condition: "Watch at least 70%",
    reward: 10,
    status: "available",
    progress: 0,
    userId: "global",
  },
  {
    id: "task-instagram-1",
    platform: "instagram",
    title: "Watch 70% of our Instagram campaign reel",
    condition: "Watch at least 70%",
    reward: 10,
    status: "available",
    progress: 0,
    userId: "global",
  },
  {
    id: "task-tiktok-1",
    platform: "tiktok",
    title: "Watch at least 70% of the TikTok challenge clip",
    condition: "Watch at least 70%",
    reward: 10,
    status: "available",
    progress: 0,
    userId: "global",
  },
];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: isLocalMode ? seedTasks : [],
      startTask: (taskId, userId) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task) return { success: false, message: "Task not found." };
        if (task.status !== "available") {
          return { success: false, message: "Task is not available to start." };
        }

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId ? { ...item, status: "in-progress", progress: 0, userId } : item,
          ),
        }));

        debugLog("task-started", { taskId });
        return { success: true, message: "Task started." };
      },
      updateTaskProgress: (taskId, nextProgress) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task) return { success: false, message: "Task not found." };
        if (task.status !== "in-progress") {
          return { success: false, message: "Task is not in progress." };
        }

        const progress = Math.max(0, Math.min(100, nextProgress));

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId
              ? { ...item, progress }
              : item,
          ),
        }));

        if (progress >= 70) {
          return { success: true, message: "Condition met. Submit proof." };
        }

        return { success: true, message: "Progress updated." };
      },
      submitTaskProof: (taskId, proof) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task) return { success: false, message: "Task not found." };
        if (task.status !== "in-progress") {
          return { success: false, message: "Task must be in progress." };
        }
        if (task.progress < 70) {
          return { success: false, message: "Complete at least 70% first." };
        }

        const normalizedProof = proof.trim();
        if (!normalizedProof) {
          return { success: false, message: "Proof is required." };
        }

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId
              ? { ...item, status: "pending", proof: normalizedProof }
              : item,
          ),
        }));

        debugLog("task-proof-submitted", { taskId });
        return { success: true, message: "Proof submitted. Waiting for admin approval." };
      },
      setTaskStatus: (taskId, status) => {
        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId
              ? { ...item, status }
              : item,
          ),
        }));
      },
    }),
    {
      name: "vieworbit-task-store",
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    },
  ),
);
