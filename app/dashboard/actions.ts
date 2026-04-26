"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteVideoLog(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("video_logs").delete().eq("id", id).eq("user_id", user.id);
}
