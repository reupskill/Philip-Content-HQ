import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { patchContentMetadata } from "@/lib/db";
import { saveActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: { metadata?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.metadata || typeof body.metadata !== "object") {
    return NextResponse.json({ error: "metadata object is required" }, { status: 400 });
  }

  try {
    const updated = await patchContentMetadata(id, email, body.metadata);
    const action = body.metadata.status ? "update_status" : body.metadata.isTrainingExample !== undefined ? "mark_training" : "patch_metadata";
    saveActivity({ user_email: email, action, content_id: id, details: body.metadata }).catch(() => {});
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("patchContentMetadata error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
