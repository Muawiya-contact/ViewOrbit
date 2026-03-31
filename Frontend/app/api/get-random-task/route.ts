import { NextResponse } from "next/server";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { assignRandomTask } from "@/lib/server/services/platform-service";

export const GET = withUserApiAuth(async (_request, context) => {
  try {
    const assigned = await assignRandomTask(context.uid);
    if (!assigned) {
      return NextResponse.json({ error: "No task available" }, { status: 404 });
    }

    return NextResponse.json(assigned);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COOLDOWN_ACTIVE") {
        return NextResponse.json({ error: "Please wait 15 seconds before requesting next task" }, { status: 429 });
      }
      if (error.message === "DAILY_LIMIT_REACHED") {
        return NextResponse.json({ error: "Daily task limit reached" }, { status: 429 });
      }
    }
    console.error("[get-random-task] GET failed", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
});
