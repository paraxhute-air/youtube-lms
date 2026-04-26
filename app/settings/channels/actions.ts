"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Channel = Database["public"]["Tables"]["search_channels"]["Row"];

function parseChannelUrl(input: string): { type: "handle" | "id"; value: string } | null {
  const trimmed = input.trim();

  // https://www.youtube.com/@handle 또는 https://www.youtube.com/@handle/videos
  const handleMatch = trimmed.match(/youtube\.com\/@([^/?&#]+)/);
  if (handleMatch) return { type: "handle", value: handleMatch[1] };

  // https://www.youtube.com/channel/UCxxxxxx
  const idMatch = trimmed.match(/youtube\.com\/channel\/(UC[^/?&#]+)/);
  if (idMatch) return { type: "id", value: idMatch[1] };

  // @handle (URL 없이 입력)
  if (trimmed.startsWith("@")) return { type: "handle", value: trimmed.slice(1) };

  // UCxxxxxx (채널 ID 직접 입력)
  if (/^UC[A-Za-z0-9_-]{20,}$/.test(trimmed)) return { type: "id", value: trimmed };

  return null;
}

async function resolveChannel(
  parsed: { type: "handle" | "id"; value: string },
  apiKey: string,
): Promise<{ channelId: string; channelName: string } | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("key", apiKey);

  if (parsed.type === "handle") {
    url.searchParams.set("forHandle", parsed.value);
  } else {
    url.searchParams.set("id", parsed.value);
  }

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) return null;

  return { channelId: channel.id, channelName: channel.snippet.title };
}

export async function addChannel(
  channelUrl: string,
): Promise<{ data?: Channel; error?: string }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { error: "API 키가 설정되지 않았습니다" };

  const parsed = parseChannelUrl(channelUrl);
  if (!parsed) return { error: "올바른 유튜브 채널 URL 또는 @핸들을 입력해주세요" };

  const resolved = await resolveChannel(parsed, apiKey);
  if (!resolved) return { error: "채널을 찾을 수 없습니다. URL을 확인해주세요" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("search_channels")
    .insert({
      channel_url: channelUrl.trim(),
      channel_name: resolved.channelName,
      channel_id: resolved.channelId,
      is_active: true,
      sort_order: 9999,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteChannel(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("search_channels").delete().eq("id", id);
}

export async function toggleChannel(id: string, is_active: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("search_channels").update({ is_active }).eq("id", id);
}

export async function reorderChannel(id: string, sort_order: number): Promise<void> {
  const supabase = await createClient();
  await supabase.from("search_channels").update({ sort_order }).eq("id", id);
}
