import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("adminRules").get();

    const rules = snapshot.docs
      .map((doc) => {
        const data = doc.data() as {
          taskType?: string;
          minWatchPercent?: number;
          minLike?: number;
          minSubscribe?: number;
          dailyCap?: number;
          rewardPoints?: number;
          createdAt?: { toDate?: () => Date };
        };

        return {
          id: doc.id,
          task_type: data.taskType ?? "youtube",
          min_watch_percent: Number(data.minWatchPercent ?? 0),
          min_like: Number(data.minLike ?? 0),
          min_subscribe: Number(data.minSubscribe ?? 0),
          daily_cap: Number(data.dailyCap ?? 1),
          reward_points: Number(data.rewardPoints ?? 0),
          created_at: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("[admin.rules] GET failed", error);
    return NextResponse.json({ error: "Failed to load rules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const db = getAdminDb();
    const ref = db.collection("adminRules").doc();

    const payload = {
      ruleId: ref.id,
      taskType: String(body.taskType ?? "youtube").toLowerCase(),
      minWatchPercent: Number(body.minWatchPercent ?? 0),
      minLike: Number(body.minLike ?? 0),
      minSubscribe: Number(body.minSubscribe ?? 0),
      dailyCap: Number(body.dailyCap ?? 1),
      rewardPoints: Number(body.rewardPoints ?? 0),
      createdAt: FieldValue.serverTimestamp(),
    };

    await ref.set(payload);
    return NextResponse.json({ rule: { id: ref.id, ...payload } });
  } catch (error) {
    console.error("[admin.rules] POST failed", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const ruleId = String(body.ruleId ?? "");
    if (!ruleId) return NextResponse.json({ error: "ruleId is required" }, { status: 400 });

    const db = getAdminDb();
    await db.collection("adminRules").doc(ruleId).set(
      {
        taskType: body.taskType,
        minWatchPercent: body.minWatchPercent,
        minLike: body.minLike,
        minSubscribe: body.minSubscribe,
        dailyCap: body.dailyCap,
        rewardPoints: body.rewardPoints,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ rule: { id: ruleId } });
  } catch (error) {
    console.error("[admin.rules] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ruleId = request.nextUrl.searchParams.get("ruleId");
    if (!ruleId) return NextResponse.json({ error: "ruleId is required" }, { status: 400 });

    const db = getAdminDb();
    await db.collection("adminRules").doc(ruleId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin.rules] DELETE failed", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 400 });
  }
}
