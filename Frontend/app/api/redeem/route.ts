import { NextResponse } from "next/server";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { redeemPoints } from "@/lib/server/services/platform-service";

export const POST = withUserApiAuth(async (request, context) => {
  try {
    const body = (await request.json()) as {
      pointsUsed?: number;
      walletType?: "JazzCash" | "EasyPaisa";
      walletNumber?: string;
    };

    const pointsUsed = Number(body.pointsUsed ?? 0);
    const walletNumber = String(body.walletNumber ?? "").trim();
    if (!pointsUsed || !body.walletType || !walletNumber) {
      return NextResponse.json({ error: "pointsUsed, walletType and walletNumber are required" }, { status: 400 });
    }

    const result = await redeemPoints({
      userId: context.uid,
      pointsUsed,
      walletType: body.walletType,
      walletNumber,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MIN_REDEEM_NOT_MET") {
        return NextResponse.json({ error: "Minimum redeem points not met" }, { status: 400 });
      }
      if (error.message === "INSUFFICIENT_POINTS") {
        return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
      }
    }

    console.error("[redeem] POST failed", error);
    return NextResponse.json({ error: "Failed to redeem points" }, { status: 500 });
  }
});
