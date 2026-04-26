"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Keyword = Database["public"]["Tables"]["search_keywords"]["Row"];

export async function addKeyword(
  keyword: string,
): Promise<{ data?: Keyword; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("search_keywords")
    .insert({ keyword, is_active: true, sort_order: 9999 })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteKeyword(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("search_keywords").delete().eq("id", id);
}

export async function toggleKeyword(
  id: string,
  is_active: boolean,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("search_keywords").update({ is_active }).eq("id", id);
}

export async function reorderKeyword(
  id: string,
  sort_order: number,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("search_keywords").update({ sort_order }).eq("id", id);
}
