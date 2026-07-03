import { getSupabase, ContentRow } from "./supabase";

export type NewContent = {
  user_email: string;
  platform: string;
  generated_content: string;
  raw_inputs: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export async function saveContent(data: NewContent): Promise<ContentRow> {
  const sb = getSupabase();
  const { data: row, error } = await sb
    .from("content")
    .insert({ ...data, metadata: data.metadata ?? {} })
    .select()
    .single();
  if (error) throw error;
  return row as ContentRow;
}

export async function listContent(
  userEmail: string,
  opts?: { platform?: string; limit?: number; trainingOnly?: boolean }
): Promise<ContentRow[]> {
  const sb = getSupabase();
  let q = sb
    .from("content")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.platform) q = q.eq("platform", opts.platform);
  if (opts?.trainingOnly) q = q.eq("metadata->>isTrainingExample", "true");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

export async function patchContentMetadata(
  id: string,
  userEmail: string,
  patch: Record<string, unknown>
): Promise<ContentRow> {
  const sb = getSupabase();
  const { data: existing, error: fetchErr } = await sb
    .from("content")
    .select("metadata")
    .eq("id", id)
    .eq("user_email", userEmail)
    .single();
  if (fetchErr) throw fetchErr;
  const merged = { ...(existing?.metadata ?? {}), ...patch };
  const { data: updated, error } = await sb
    .from("content")
    .update({ metadata: merged })
    .eq("id", id)
    .eq("user_email", userEmail)
    .select()
    .single();
  if (error) throw error;
  return updated as ContentRow;
}

export async function getContentStats(userEmail: string): Promise<{
  total: number;
  byPlatform: Record<string, number>;
  trainingExamples: number;
}> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("content")
    .select("platform, metadata")
    .eq("user_email", userEmail);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ platform: string; metadata: Record<string, unknown> }>;
  const byPlatform: Record<string, number> = {};
  let trainingExamples = 0;
  for (const row of rows) {
    byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + 1;
    if (row.metadata?.isTrainingExample) trainingExamples++;
  }
  return { total: rows.length, byPlatform, trainingExamples };
}
