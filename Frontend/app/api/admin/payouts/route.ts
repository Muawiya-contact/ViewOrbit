import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { withAdminApiAuth } from "@/lib/server/api-auth";
import { approvePayoutRequest, rejectPayoutRequest } from "@/lib/server/services/payout-service";

export const dynamic = "force-dynamic";

export const GET = withAdminApiAuth(async () => {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("payoutRequests").get();

    const payouts = snapshot.docs
      .map((doc) => {
        const data = doc.data() as {
          userId?: string;
          amountPoints?: number;
          amountPkr?: number;
          method?: string;
          accountNumber?: string;
          status?: string;
          createdAt?: { toDate?: () => Date };
        };

        return {
          id: doc.id,
          user_id: data.userId ?? "",
          amount_points: Number(data.amountPoints ?? 0),
          amount_pkr: Number(data.amountPkr ?? 0),
          method: data.method ?? "",
          account_number: data.accountNumber ?? "",
          status: data.status ?? "pending",
          created_at: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("[admin.payouts] GET failed", error);
    return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 });
  }
});

export const POST = withAdminApiAuth(async (request, adminContext) => {
  const body = await request.json();
  const payoutId = String(body.payoutId ?? "");
  const action = String(body.action ?? "").toLowerCase();
  const reason = String(body.reason ?? "").trim();

  if (!payoutId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "payoutId and valid action are required" }, { status: 400 });
  }

  try {
    if (action === "approve") {
      await approvePayoutRequest({ payoutId, adminId: adminContext.adminId });
    } else {
      await rejectPayoutRequest({ payoutId, adminId: adminContext.adminId, reason });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PAYOUT_NOT_FOUND") {
        return NextResponse.json({ error: "Payout not found" }, { status: 404 });
      }

      if (error.message === "PAYOUT_ALREADY_REVIEWED") {
        return NextResponse.json({ error: "Payout already reviewed" }, { status: 400 });
      }
    }

    console.error("[admin.payouts] POST failed", error);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 400 });
  }
});
