import { NextResponse } from "next/server";

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
  const maxResults = searchParams.get("maxResults") ?? "20";
  const order = searchParams.get("order") ?? (channelId ? "date" : "relevance");

  if (!keyword && !channelId) {
    return NextResponse.json({ error: "keyword or channelId is required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    // 1단계: 검색 (키워드 또는 채널)
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", maxResults);
    searchUrl.searchParams.set("key", apiKey);

    if (channelId) {
      searchUrl.searchParams.set("channelId", channelId);
    } else {
      searchUrl.searchParams.set("q", keyword!);
      searchUrl.searchParams.set("relevanceLanguage", "ko");
    }
    searchUrl.searchParams.set("order", order);

    const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 3600 } });
    if (!searchRes.ok) throw new Error("YouTube search failed");

    const searchData = await searchRes.json();
    const items = searchData.items ?? [];
    const videoIds = items
      .map((i: { id: { videoId: string } }) => i.id.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) return NextResponse.json({ videos: [] });

    // 2단계: 상세 정보 (조회수, 길이)
    const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videoUrl.searchParams.set("part", "statistics,contentDetails");
    videoUrl.searchParams.set("id", videoIds);
    videoUrl.searchParams.set("key", apiKey);

    const videoRes = await fetch(videoUrl.toString(), { next: { revalidate: 3600 } });
    const videoData = videoRes.ok ? await videoRes.json() : { items: [] };

    const statsMap = new Map(
      (videoData.items ?? []).map((v: {
        id: string;
        statistics: { viewCount: string };
        contentDetails: { duration: string };
      }) => [
        v.id,
        { viewCount: v.statistics?.viewCount ?? "0", duration: v.contentDetails?.duration ?? "" },
      ]),
    );

    const videos: YoutubeVideo[] = items.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
        publishedAt: string;
      };
    }) => {
      const stats = statsMap.get(item.id.videoId) as { viewCount: string; duration: string } | undefined;
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          "",
        publishedAt: item.snippet.publishedAt,
        viewCount: stats?.viewCount ?? "0",
        duration: parseDuration(stats?.duration ?? ""),
      };
    });

    return NextResponse.json({ videos });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
