import { NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/server/api-auth";
import { createTaskDefinition } from "@/lib/server/services/task-assignment-service";

export const dynamic = "force-dynamic";

export const POST = withAdminApiAuth(async (request, admin) => {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      platform?: "youtube" | "instagram" | "facebook" | "tiktok";
      rewardPoints?: number;
      dailyCap?: number;
      minAccountAgeDays?: number;
      isActive?: boolean;
    };

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const task = await createTaskDefinition({
      title: body.title,
      description: body.description,
      platform: body.platform,
      rewardPoints: body.rewardPoints,
      dailyCap: body.dailyCap,
      minAccountAgeDays: body.minAccountAgeDays,
      isActive: body.isActive,
      createdBy: admin.adminId,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("[admin.tasks.create] POST failed", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
});
