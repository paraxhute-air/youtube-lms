import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface YoutubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  duration: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const channelId = searchParams.get("channelId");
  const maxResults = parseInt(searchParams.get("maxResults") ?? "50", 10);
  const order = searchParams.get("order") ?? "date";
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const lang = searchParams.get("lang") ?? "all"; // 'ko', 'en', 'all'
  const offset = parseInt(searchParams.get("pageToken") ?? "0", 10);

  if (!keyword && !channelId) {
    return NextResponse.json({ error: "keyword or channelId is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    let query = supabase.from("youtube_videos").select("*", { count: "exact" });

    // 필터링 적용
    if (channelId) {
      query = query.contains("matched_channels", [channelId]);
    } else if (keyword) {
      query = query.contains("matched_keywords", [keyword]);
    }

    if (lang === "ko") {
      query = query.eq("is_korean", true);
    } else if (lang === "en" || lang === "global") {
      query = query.eq("is_global", true);
    }

    if (year) {
      if (month) {
        const y = parseInt(year);
        const m = parseInt(month);
        const startDate = new Date(Date.UTC(y, m - 1, 1));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        query = query.gte("published_at", startDate.toISOString());
        query = query.lte("published_at", endDate.toISOString());
      } else {
        query = query.gte("published_at", `${year}-01-01T00:00:00Z`);
        query = query.lte("published_at", `${year}-12-31T23:59:59Z`);
      }
    }

    // 정렬
    if (order === "viewCount") {
      query = query.order("view_count", { ascending: false });
    } else {
      query = query.order("published_at", { ascending: false });
    }

    // 페이지네이션
    query = query.range(offset, offset + maxResults - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("DB Query Error:", error);
      throw new Error("Failed to fetch videos from DB");
    }

    const finalVideos: YoutubeVideo[] = data.map((v) => ({
      id: v.id,
      title: v.title,
      channelTitle: v.channel_title,
      thumbnail: v.thumbnail,
      publishedAt: v.published_at,
      viewCount: v.view_count.toString(),
      duration: v.duration,
    }));

    const nextOffset = offset + data.length;
    const hasMore = count !== null && nextOffset < count;

    return NextResponse.json(
      { videos: finalVideos, nextPageToken: hasMore ? nextOffset.toString() : null },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" } }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
