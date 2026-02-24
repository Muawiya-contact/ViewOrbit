"use client";

import { create } from "zustand";
import { useTaskStore, type TaskLifecycleStatus } from "./useTaskStore";
import { useWalletStore } from "@/lib/store/useWalletStore";
import { debugLog } from "@/lib/config/env";

interface AdminState {
  taskFilter: "all" | TaskLifecycleStatus;
  setTaskFilter: (value: "all" | TaskLifecycleStatus) => void;
  approveTask: (taskId: string) => { success: boolean; message: string };
  rejectTask: (taskId: string) => { success: boolean; message: string };
  approvePayout: (requestId: string) => void;
  rejectPayout: (requestId: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  taskFilter: "all",
  setTaskFilter: (value) => set({ taskFilter: value }),
  approveTask: (taskId) => {
    const taskStore = useTaskStore.getState();
    const walletStore = useWalletStore.getState();
    const task = taskStore.tasks.find((item) => item.id === taskId);

    if (!task) {
      return { success: false, message: "Task not found." };
    }

    if (task.status !== "pending") {
      return { success: false, message: "Task is not pending." };
    }

    taskStore.setTaskStatus(taskId, "approved");
    walletStore.addRewardPoints({
      taskId: task.id,
      userId: task.userId,
      points: task.reward,
      note: `Approved task reward: ${task.title}`,
    });

    debugLog("admin-task-approved", { taskId, reward: task.reward });
    return { success: true, message: "Task approved and reward credited." };
  },
  rejectTask: (taskId) => {
    const taskStore = useTaskStore.getState();
    const task = taskStore.tasks.find((item) => item.id === taskId);

    if (!task) {
      return { success: false, message: "Task not found." };
    }

    taskStore.setTaskStatus(taskId, "rejected");
    debugLog("admin-task-rejected", { taskId });
    return { success: true, message: "Task rejected." };
  },
  approvePayout: (requestId) => {
    useWalletStore.getState().setWithdrawStatus(requestId, "approved");
    debugLog("admin-payout-approved", { requestId });
  },
  rejectPayout: (requestId) => {
    useWalletStore.getState().setWithdrawStatus(requestId, "rejected");
    debugLog("admin-payout-rejected", { requestId });
  },
}));
