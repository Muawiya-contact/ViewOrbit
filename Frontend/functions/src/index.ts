import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { google } from "googleapis";

initializeApp();
const db = getFirestore();

// 1) Notify admins when a new withdraw request is created.
export const onWithdrawRequestCreated = onDocumentCreated(
  "withdrawRequests/{withdrawId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const message = `New withdraw request from ${data.userId} for ${data.pointsUsed} points`;
    const notificationRef = db.collection("notifications").doc();
    await notificationRef.set({
      id: notificationRef.id,
      type: "withdraw_request",
      userId: data.userId,
      title: "New Withdraw Request",
      message,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });
  },
);

// 2) Server-side task completion reward (idempotent)
export const finalizeTaskCompletion = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");

  const assignmentId = String(request.data?.assignmentId ?? "").trim();
  if (!assignmentId) throw new HttpsError("invalid-argument", "assignmentId is required");

  const assignmentRef = db.collection("taskAssignments").doc(assignmentId);
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const assignmentSnap = await tx.get(assignmentRef);
    if (!assignmentSnap.exists) throw new HttpsError("not-found", "Assignment not found");

    const assignment = assignmentSnap.data() as {
      userId: string;
      taskId: string;
      completed?: boolean;
    };
    if (assignment.userId !== uid) throw new HttpsError("permission-denied", "Forbidden");
    if (assignment.completed) return { alreadyCompleted: true, pointsAwarded: 0 };

    const taskRef = db.collection("tasks").doc(assignment.taskId);
    const taskSnap = await tx.get(taskRef);
    if (!taskSnap.exists) throw new HttpsError("not-found", "Task not found");

    const task = taskSnap.data() as { points?: number };
    const points = Number(task.points ?? 10);

    tx.update(assignmentRef, {
      completed: true,
      completedAt: FieldValue.serverTimestamp(),
    });
    tx.update(userRef, {
      points: FieldValue.increment(points),
      tasksCompleted: FieldValue.increment(1),
      activeTaskId: null,
    });

    const historyRef = db.collection("taskHistory").doc();
    tx.set(historyRef, {
      id: historyRef.id,
      userId: uid,
      taskId: assignment.taskId,
      pointsEarned: points,
      verified: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { alreadyCompleted: false, pointsAwarded: points };
  });
});

// 3) Hybrid YouTube comment verification helper
export const verifyYouTubeComment = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");

  const videoId = String(request.data?.videoId ?? "").trim();
  const commentText = String(request.data?.commentText ?? "").trim();
  if (!videoId || !commentText) {
    throw new HttpsError("invalid-argument", "videoId and commentText are required");
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    logger.warn("YOUTUBE_API_KEY not configured, fallback to pending verification");
    return { verified: false, pendingVerification: true };
  }

  const youtube = google.youtube({ version: "v3", auth: apiKey });
  const result = await youtube.commentThreads.list({
    part: ["snippet"],
    videoId,
    maxResults: 100,
    order: "time",
  });

  const found = (result.data.items ?? []).some((item) => {
    const text = item.snippet?.topLevelComment?.snippet?.textDisplay ?? "";
    return text.toLowerCase().includes(commentText.toLowerCase());
  });

  return { verified: found, pendingVerification: !found };
});
