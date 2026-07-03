import { getSupabase } from "./supabase";

export type ActivityAction =
  | "generate_video"
  | "generate_linkedin"
  | "generate_x"
  | "generate_substack"
  | "generate_content_river"
  | "generate_daily_brief"
  | "update_status"
  | "mark_training"
  | "patch_metadata";

export async function saveActivity(data: {
  user_email: string;
  action: ActivityAction;
  content_id?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sb = getSupabase();
    await sb.from("activity_log").insert({
      user_email: data.user_email,
      action: data.action,
      content_id: data.content_id ?? null,
      details: data.details ?? {},
    });
  } catch {
    // Table may not exist yet — fail silently so app never crashes
  }
}

export async function listActivity(
  userEmail: string,
  limit = 100
): Promise<Array<{ id: string; action: string; content_id: string | null; details: Record<string, unknown>; created_at: string; user_email: string }>> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("activity_log")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
