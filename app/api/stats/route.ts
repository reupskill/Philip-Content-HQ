import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getContentStats, listContent } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const email = await requireAuth(request).catch(() => null);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [stats, recent] = await Promise.all([
      getContentStats(email),
      listContent(email, { limit: 10 }),
    ]);
    return NextResponse.json({ stats, recent });
  } catch (error) {
    console.error("stats error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
