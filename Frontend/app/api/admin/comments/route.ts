import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  const snapshot = await db.collection("comments").orderBy("createdAt", "desc").limit(200).get();
  const comments = snapshot.docs.map((doc) => ({
    commentId: doc.id,
    text: String((doc.data() as { text?: string }).text ?? ""),
  }));

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { text?: string; comments?: string[] };
  const db = getAdminDb();

  const incoming = Array.isArray(body.comments) ? body.comments : [String(body.text ?? "")];
  const prepared = incoming.map((text) => text.trim()).filter((text) => text.length > 0);
  if (prepared.length === 0) {
    return NextResponse.json({ error: "No valid comment text provided" }, { status: 400 });
  }

  const batch = db.batch();
  for (const text of prepared) {
    const ref = db.collection("comments").doc();
    batch.set(ref, {
      commentId: ref.id,
      text,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: adminContext.adminId,
    });
  }

  await batch.commit();
  return NextResponse.json({ success: true, createdCount: prepared.length }, { status: 201 });
}
