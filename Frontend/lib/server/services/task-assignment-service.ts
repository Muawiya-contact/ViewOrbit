import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { assignTaskForUser, ensureUserProfile } from "@/lib/server/task-engine";
import type { AssignedTaskResponse } from "@/lib/types/task-engine";
import type { TaskDoc } from "@/lib/types/firestore";

export async function listAvailableTasksForUser(uid: string, email: string | null): Promise<AssignedTaskResponse[]> {
  await ensureUserProfile(uid, email);
  const task = await assignTaskForUser(uid);
  return task ? [task] : [];
}

export async function assignTaskToUser(uid: string, email: string | null): Promise<AssignedTaskResponse | null> {
  await ensureUserProfile(uid, email);
  return assignTaskForUser(uid);
}

export async function acceptTaskAssignment(uid: string, assignmentId: string): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.collection("taskAssignments").doc(assignmentId);
  const snapshot = await ref.get();

  if (!snapshot.exists) return false;

  const assignment = snapshot.data() as { assignedUserId?: string; userId?: string; status?: string };
  if ((assignment.userId ?? assignment.assignedUserId ?? "") !== uid) {
    throw new Error("Forbidden");
  }

  const status = assignment.status ?? "assigned";
  if (status !== "assigned") {
    return true;
  }

  await ref.set(
    {
      status: "in_progress",
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return true;
}

export async function createTaskDefinition(input: {
  title: string;
  description?: string;
  platform?: "youtube" | "instagram" | "facebook" | "tiktok";
  rewardPoints?: number;
  dailyCap?: number;
  minAccountAgeDays?: number;
  isActive?: boolean;
  createdBy: string;
}): Promise<TaskDoc> {
  const db = getAdminDb();
  const ref = db.collection("tasks").doc();

  const rawPlatform = String(input.platform ?? "youtube").toLowerCase();
  const taskType =
    rawPlatform === "youtube"
      ? "view"
      : rawPlatform === "instagram"
        ? "like"
        : rawPlatform === "facebook"
          ? "subscribe"
          : rawPlatform === "tiktok"
            ? "comment"
            : "view";

  const status: TaskDoc["status"] = input.isActive === false ? "paused" : "active";

  const task: TaskDoc = {
    taskId: ref.id,
    videoId: "",
    channelId: "",
    taskType,
    rewardPoints: Math.max(0, Number(input.rewardPoints ?? 10)),
    maxUsers: Math.max(1, Number(input.dailyCap ?? 1)),
    status,
    createdBy: input.createdBy,
  };

  await ref.set({
    ...task,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return task;
}
