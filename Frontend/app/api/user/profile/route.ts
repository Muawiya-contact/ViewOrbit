import { NextResponse } from "next/server";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { getUserProfile } from "@/lib/server/services/user-service";

export const GET = withUserApiAuth(async (_request, context) => {
  try {
    const profile = await getUserProfile(context.uid);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      uid: profile.uid,
      email: profile.email,
      points: profile.points,
      walletType: profile.walletType,
      walletNumber: profile.walletNumber,
      streak: profile.streak,
    });
  } catch (error) {
    console.error("[user.profile] GET failed", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
});
