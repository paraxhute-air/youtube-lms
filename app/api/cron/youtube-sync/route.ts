import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const hasKo = (s: string) => /[가-힣]/.test(s);
const isGlobalVideo = (v: { title: string }) =>
  /^[\p{Script=Latin}\d\p{Punctuation}\p{Symbol}\s]+$/u.test(v.title);

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5분 (Vercel Pro/Enterprise 환경에서 사용 가능, Hobby는 무시됨)

export async function GET(request: Request) {
  // 간단한 보안 (실제 환경에서는 VERCEL_CRON_SECRET 등을 활용)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not found" }, { status: 500 });
  }

  try {
    // 1. 활성화된 키워드와 채널 가져오기
    const [{ data: keywords }, { data: channels }] = await Promise.all([
      supabase.from("search_keywords").select("keyword").eq("is_active", true),
      supabase.from("search_channels").select("channel_id").eq("is_active", true).not("channel_id", "is", null),
    ]);

    const activeKeywords = (keywords || []).map((k) => k.keyword);
    const activeChannels = (channels || []).map((c) => c.channel_id!);

    const allVideosMap = new Map<string, Database["public"]["Tables"]["youtube_videos"]["Insert"]>();

    // 공통 비디오 수집 함수
    const fetchVideos = async (query: string, isChannel: boolean) => {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("maxResults", "50"); // 한 번에 최대 50개 가져오기
      searchUrl.searchParams.set("key", apiKey);

      if (isChannel) {
        searchUrl.searchParams.set("channelId", query);
        searchUrl.searchParams.set("order", "date"); // 채널은 최신순 위주
      } else {
        searchUrl.searchParams.set("q", query);
        searchUrl.searchParams.set("relevanceLanguage", "en"); // 관련성 높이기
        searchUrl.searchParams.set("order", "relevance");
      }

      const searchRes = await fetch(searchUrl.toString());
      if (!searchRes.ok) return; // 할당량 초과 등이 발생하면 스킵

      const searchData = await searchRes.json();
      const items = searchData.items ?? [];
      const videoIds = items.map((i: any) => i.id.videoId).filter(Boolean).join(",");

      if (!videoIds) return;

      const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videoUrl.searchParams.set("part", "statistics,contentDetails");
      videoUrl.searchParams.set("id", videoIds);
      videoUrl.searchParams.set("key", apiKey);

      const videoRes = await fetch(videoUrl.toString());
      if (!videoRes.ok) return;

      const videoData = await videoRes.json();
      const statsMap = new Map(
        (videoData.items ?? []).map((v: any) => [
          v.id,
          {
            viewCount: parseInt(v.statistics?.viewCount ?? "0"),
            duration: v.contentDetails?.duration ?? "",
          },
        ])
      );

      items.forEach((item: any) => {
        const id = item.id.videoId;
        const snippet = item.snippet;
        const stats = statsMap.get(id);
        if (!stats) return;

        const is_korean = hasKo(snippet.title) || hasKo(snippet.channelTitle);
        const is_global = isGlobalVideo({ title: snippet.title });

        if (!allVideosMap.has(id)) {
          allVideosMap.set(id, {
            id,
            title: snippet.title,
            channel_title: snippet.channelTitle,
            channel_id: snippet.channelId,
            thumbnail: snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url || "",
            published_at: snippet.publishedAt,
            view_count: stats.viewCount,
            duration: parseDuration(stats.duration),
            is_korean,
            is_global,
            matched_keywords: [],
            matched_channels: [],
            updated_at: new Date().toISOString(),
          });
        }

        const video = allVideosMap.get(id)!;
        if (isChannel) {
          if (!video.matched_channels!.includes(query)) video.matched_channels!.push(query);
        } else {
          if (!video.matched_keywords!.includes(query)) video.matched_keywords!.push(query);
        }
      });
    };

    // 하나씩 순차 실행 (또는 청크로 분할)하여 Rate limit 방지
    for (const keyword of activeKeywords) {
      await fetchVideos(keyword, false);
    }
    for (const channelId of activeChannels) {
      await fetchVideos(channelId, true);
    }

    // DB에 Upsert
    const videosToUpsert = Array.from(allVideosMap.values());
    
    // Supabase RPC나 여러 번 나누어 Upsert (제한이 있을 수 있으므로 100개씩)
    const chunkSize = 100;
    for (let i = 0; i < videosToUpsert.length; i += chunkSize) {
      const chunk = videosToUpsert.slice(i, i + chunkSize);
      const { error } = await supabase.from("youtube_videos").upsert(chunk, {
        onConflict: "id",
      });
      if (error) {
        console.error("Upsert error:", error);
      }
    }

    return NextResponse.json({ success: true, count: videosToUpsert.length });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
