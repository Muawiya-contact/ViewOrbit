import { NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/server/api-auth";
import { getConversionSettings, updateConversionSettings } from "@/lib/server/services/points-service";

export const dynamic = "force-dynamic";

export const GET = withAdminApiAuth(async () => {
  try {
    const settings = await getConversionSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[admin.settings] GET failed", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
});

export const PATCH = withAdminApiAuth(async (request, admin) => {
  try {
    const body = (await request.json()) as {
      pointsPerUnit?: number;
      pkrPerUnit?: number;
      minPayoutPoints?: number;
    };

    const settings = await updateConversionSettings({
      pointsPerUnit: Number(body.pointsPerUnit ?? 1000),
      pkrPerUnit: Number(body.pkrPerUnit ?? 100),
      minPayoutPoints: Number(body.minPayoutPoints ?? body.pointsPerUnit ?? 1000),
      updatedBy: admin.adminId,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[admin.settings] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
});
