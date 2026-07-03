import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 100));

  const items = await listActivity(email, limit);
  return NextResponse.json({ items });
}
