import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { createPayoutRequest } from "@/lib/server/services/payout-service";
import { getConversionSettings } from "@/lib/server/services/points-service";

export const GET = withUserApiAuth(async (_request, user) => {
  const db = getAdminDb();
  const snapshot = await db.collection("payoutRequests").where("userId", "==", user.uid).get();

  const payouts = snapshot.docs
    .map((doc) => {
      const payout = doc.data() as {
        amountPoints?: number;
        amountPkr?: number;
        method?: string;
        accountNumber?: string;
        status?: string;
        createdAt?: { toDate?: () => Date };
      };

      return {
        id: doc.id,
        amount_points: Number(payout.amountPoints ?? 0),
        amount_pkr: Number(payout.amountPkr ?? 0),
        method: payout.method ?? "",
        account_number: payout.accountNumber ?? "",
        status: payout.status ?? "pending",
        created_at: payout.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  const settings = await getConversionSettings();
  return NextResponse.json({ payouts, settings });
});

export const POST = withUserApiAuth(async (request, user) => {
  try {
    const body = (await request.json()) as {
      amountPoints?: number;
      method?: string;
      accountNumber?: string;
    };

    const amountPoints = Number(body.amountPoints ?? 0);
    const method = String(body.method ?? "").toLowerCase();
    const accountNumber = String(body.accountNumber ?? "").trim();

    if (!amountPoints || !["jazzcash", "easypaisa"].includes(method) || !accountNumber) {
      return NextResponse.json({ error: "Missing required payout fields" }, { status: 400 });
    }

    const payout = await createPayoutRequest({
      userId: user.uid,
      amountPoints,
      method: method as "jazzcash" | "easypaisa",
      accountNumber,
    });

    return NextResponse.json({
      success: true,
      payoutId: payout.payoutId,
      amountPkr: payout.amountPkr,
      walletPoints: payout.walletPoints,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_POINTS") {
        return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
      }

      if (error.message === "MIN_PAYOUT_NOT_REACHED") {
        return NextResponse.json({ error: "Minimum payout points not reached" }, { status: 400 });
      }

      if (error.message === "INVALID_AMOUNT") {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
    }

    console.error("[payouts] POST failed", error);
    return NextResponse.json({ error: "Payout request failed" }, { status: 500 });
  }
});
