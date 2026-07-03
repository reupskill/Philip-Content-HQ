import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listContent } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") || undefined;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const trainingOnly = searchParams.get("trainingOnly") === "true";

  try {
    const items = await listContent(email, { platform, limit, trainingOnly });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("listContent error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
