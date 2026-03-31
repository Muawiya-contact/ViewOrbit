import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import type { TaskAssignmentModel, TaskModel, TaskType } from "@/lib/types/platform";

const SETTINGS_DOC = "platform";

export async function createTask(input: {
  videoId: string;
  videoUrl: string;
  channelId: string;
  taskType: TaskType;
  rewardPoints: number;
  maxUsers: number;
  createdBy: string;
}): Promise<TaskModel> {
  const db = getAdminDb();

  const activeChannels = await db
    .collection("channels")
    .where("status", "==", "active")
    .limit(4)
    .get();
  if (activeChannels.size > 3) {
    throw new Error("MAX_ACTIVE_CHANNELS_EXCEEDED");
  }

  const ref = db.collection("tasks").doc();
  const task: TaskModel = {
    taskId: ref.id,
    videoId: input.videoId,
    videoUrl: input.videoUrl,
    channelId: input.channelId,
    taskType: input.taskType,
    rewardPoints: Math.max(1, input.rewardPoints),
    maxUsers: Math.max(1, input.maxUsers),
    assignedUsersCount: 0,
    status: "active",
    createdBy: input.createdBy,
  };

  await ref.set({
    ...task,
    createdAt: FieldValue.serverTimestamp(),
  });

  return task;
}

export async function assignRandomTask(userId: string): Promise<{ assignment: TaskAssignmentModel; task: TaskModel } | null> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const settingsRef = db.collection("platformSettings").doc("main");

  const [userSnap, settingsSnap] = await Promise.all([userRef.get(), settingsRef.get()]);
  const user = (userSnap.data() ?? {}) as { lastTaskAssignedAt?: { toDate?: () => Date }; tasksCompleted?: number };
  const settings = (settingsSnap.data() ?? {}) as { dailyTaskLimit?: number };

  const lastAssignedAt = user.lastTaskAssignedAt?.toDate?.();
  if (lastAssignedAt && Date.now() - lastAssignedAt.getTime() < 15_000) {
    throw new Error("COOLDOWN_ACTIVE");
  }

  const dailyTaskLimit = Number(settings.dailyTaskLimit ?? 20);
  if (Number(user.tasksCompleted ?? 0) >= dailyTaskLimit) {
    throw new Error("DAILY_LIMIT_REACHED");
  }

  const activeTasks = await db.collection("tasks").where("status", "==", "active").limit(100).get();
  if (activeTasks.empty) return null;

  const shuffled = [...activeTasks.docs].sort(() => Math.random() - 0.5);
  for (const doc of shuffled) {
    const task = doc.data() as TaskModel;
    const assignmentRef = db.collection("taskAssignments").doc();
    const taskRef = db.collection("tasks").doc(doc.id);

    const assigned = await db.runTransaction(async (tx) => {
      const [taskSnap, existingUserAssignmentSnap] = await Promise.all([
        tx.get(taskRef),
        tx.get(
          db
            .collection("taskAssignments")
            .where("taskId", "==", doc.id)
            .where("userId", "==", userId)
            .limit(1),
        ),
      ]);

      if (!taskSnap.exists) return null;
      if (!existingUserAssignmentSnap.empty) return null;

      const latestTask = taskSnap.data() as TaskModel;
      if (latestTask.status !== "active") return null;
      if (Number(latestTask.assignedUsersCount ?? 0) >= Number(latestTask.maxUsers ?? 0)) return null;

      const assignment: TaskAssignmentModel = {
        assignmentId: assignmentRef.id,
        taskId: doc.id,
        userId,
        status: "assigned",
      };

      tx.set(assignmentRef, {
        ...assignment,
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.set(
        userRef,
        {
          activeTaskId: assignmentRef.id,
          lastTaskAssignedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      tx.update(taskRef, {
        assignedUsersCount: FieldValue.increment(1),
        status:
          Number(latestTask.assignedUsersCount ?? 0) + 1 >= Number(latestTask.maxUsers ?? 0)
            ? "completed"
            : "active",
      });

      return assignment;
    });

    if (assigned) {
      return { assignment: assigned, task: { ...task, taskId: doc.id } };
    }
  }

  return null;
}

export async function completeTask(params: {
  assignmentId: string;
  userId: string;
  proof?: string;
}): Promise<{ rewardPoints: number }> {
  const db = getAdminDb();
  const assignmentRef = db.collection("taskAssignments").doc(params.assignmentId);
  const userRef = db.collection("users").doc(params.userId);

  return db.runTransaction(async (tx) => {
    const assignmentSnap = await tx.get(assignmentRef);
    if (!assignmentSnap.exists) throw new Error("ASSIGNMENT_NOT_FOUND");

    const assignment = assignmentSnap.data() as TaskAssignmentModel;
    if (assignment.userId !== params.userId) throw new Error("FORBIDDEN");
    if (assignment.status === "completed") return { rewardPoints: 0 };

    const taskRef = db.collection("tasks").doc(assignment.taskId);
    const taskSnap = await tx.get(taskRef);
    if (!taskSnap.exists) throw new Error("TASK_NOT_FOUND");

    const task = taskSnap.data() as TaskModel;
    const rewardPoints = Number(task.rewardPoints ?? 0);

    tx.update(assignmentRef, {
      status: "completed",
      proof: params.proof?.trim() ? params.proof.trim() : null,
      completedAt: FieldValue.serverTimestamp(),
    });

    tx.update(userRef, {
      points: FieldValue.increment(rewardPoints),
    });

    return { rewardPoints };
  });
}

export async function redeemPoints(params: {
  userId: string;
  pointsUsed: number;
  walletType: "JazzCash" | "EasyPaisa";
  walletNumber: string;
}): Promise<{ redeemId: string; pkrAmount: number }> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(params.userId);
  const redemptionRef = db.collection("redemptions").doc();
  const settingsRef = db.collection("settings").doc(SETTINGS_DOC);

  return db.runTransaction(async (tx) => {
    const [userSnap, settingsSnap] = await Promise.all([tx.get(userRef), tx.get(settingsRef)]);
    if (!userSnap.exists) throw new Error("USER_NOT_FOUND");

    const user = userSnap.data() as { points?: number };
    const settings = (settingsSnap.data() ?? {}) as { pointToPKR?: number; minRedeemPoints?: number };
    const pointToPKR = Number(settings.pointToPKR ?? 0.1);
    const minRedeemPoints = Number(settings.minRedeemPoints ?? 100);

    if (params.pointsUsed < minRedeemPoints) throw new Error("MIN_REDEEM_NOT_MET");
    if (Number(user.points ?? 0) < params.pointsUsed) throw new Error("INSUFFICIENT_POINTS");

    const pkrAmount = Number((params.pointsUsed * pointToPKR).toFixed(2));

    tx.update(userRef, {
      points: FieldValue.increment(-params.pointsUsed),
    });

    tx.set(redemptionRef, {
      redeemId: redemptionRef.id,
      userId: params.userId,
      pointsUsed: params.pointsUsed,
      pkrAmount,
      walletType: params.walletType,
      walletNumber: params.walletNumber,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      processedAt: null,
    });

    return { redeemId: redemptionRef.id, pkrAmount };
  });
}
