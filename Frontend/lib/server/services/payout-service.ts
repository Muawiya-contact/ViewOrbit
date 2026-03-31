import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { calculatePkr, getConversionSettings } from "@/lib/server/services/points-service";
import type { PayoutRequestDoc } from "@/lib/types/firestore";

export async function createPayoutRequest(input: {
  userId: string;
  amountPoints: number;
  method: "jazzcash" | "easypaisa";
  accountNumber: string;
}): Promise<{ payoutId: string; amountPkr: number; walletPoints: number }> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(input.userId);
  const payoutRef = db.collection("payoutRequests").doc();
  const settings = await getConversionSettings();

  const amountPoints = Math.max(0, Number(input.amountPoints) || 0);
  if (!amountPoints) {
    throw new Error("INVALID_AMOUNT");
  }

  if (amountPoints < settings.minPayoutPoints) {
    throw new Error("MIN_PAYOUT_NOT_REACHED");
  }

  const amountPkr = calculatePkr(amountPoints, settings);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data() as { points?: number } | undefined;
    const points = Number(userData?.points ?? 0);

    if (points < amountPoints) {
      throw new Error("INSUFFICIENT_POINTS");
    }

    tx.set(
      userRef,
      {
        points: points - amountPoints,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const payout: PayoutRequestDoc = {
      payoutId: payoutRef.id,
      userId: input.userId,
      amountPoints,
      amountPkr,
      method: input.method,
      accountNumber: input.accountNumber,
      status: "pending",
    };

    tx.set(payoutRef, {
      ...payout,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const updatedUser = await userRef.get();
  const walletPoints = Number((updatedUser.data() as { points?: number } | undefined)?.points ?? 0);

  return {
    payoutId: payoutRef.id,
    amountPkr,
    walletPoints,
  };
}

export async function approvePayoutRequest(input: { payoutId: string; adminId: string }): Promise<void> {
  const db = getAdminDb();
  const payoutRef = db.collection("payoutRequests").doc(input.payoutId);
  const snapshot = await payoutRef.get();

  if (!snapshot.exists) {
    throw new Error("PAYOUT_NOT_FOUND");
  }

  const payout = snapshot.data() as PayoutRequestDoc;
  if (payout.status !== "pending") {
    throw new Error("PAYOUT_ALREADY_REVIEWED");
  }

  await payoutRef.set(
    {
      status: "approved",
      reviewedBy: input.adminId,
      reviewedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (payout.userId) {
    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      notificationId: notifRef.id,
      userId: payout.userId,
      type: "payout",
      message: "Your payout request was approved.",
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

export async function rejectPayoutRequest(input: {
  payoutId: string;
  adminId: string;
  reason?: string;
}): Promise<void> {
  const db = getAdminDb();
  const payoutRef = db.collection("payoutRequests").doc(input.payoutId);

  await db.runTransaction(async (tx) => {
    const payoutSnap = await tx.get(payoutRef);
    if (!payoutSnap.exists) {
      throw new Error("PAYOUT_NOT_FOUND");
    }

    const payout = payoutSnap.data() as PayoutRequestDoc;
    if (payout.status !== "pending") {
      throw new Error("PAYOUT_ALREADY_REVIEWED");
    }

    tx.set(
      payoutRef,
      {
        status: "rejected",
        reviewedBy: input.adminId,
        reviewedAt: FieldValue.serverTimestamp(),
        rejectionReason: input.reason ?? "",
      },
      { merge: true },
    );

    const userRef = db.collection("users").doc(payout.userId);
    tx.set(
      userRef,
      {
        points: FieldValue.increment(Number(payout.amountPoints ?? 0)),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  const payoutSnap = await payoutRef.get();
  const payout = payoutSnap.data() as PayoutRequestDoc | undefined;

  if (payout?.userId) {
    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      notificationId: notifRef.id,
      userId: payout.userId,
      type: "payout",
      message: "Your payout request was rejected and points were returned.",
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}
