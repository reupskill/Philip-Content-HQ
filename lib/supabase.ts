import { createClient } from "@supabase/supabase-js";

export type ContentRow = {
  id: string;
  user_email: string;
  platform: string;
  generated_content: string;
  raw_inputs: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  }
  return createClient(url, key);
}
