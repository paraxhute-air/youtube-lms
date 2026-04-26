"use client";

import Link from "next/link";
import Image from "next/image";
import type { YoutubeVideo } from "@/app/api/youtube/route";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        stroke={filled ? "#f59e0b" : "var(--muted)"}
        strokeWidth="1.5"
        fill={filled ? "#f59e0b" : "none"}
      />
    </svg>
  );
}

function formatViews(n: string) {
  const num = parseInt(n, 10);
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
  return n;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "오늘";
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

interface Props {
  video: YoutubeVideo;
  wishlisted?: boolean;
  onToggleWishlist?: () => void;
  subtitlesEnabled?: boolean;
}

export function VideoCard({ video, wishlisted = false, onToggleWishlist, subtitlesEnabled = false }: Props) {
  const watchHref = subtitlesEnabled ? `/watch/${video.id}?cc=ko` : `/watch/${video.id}`;
  return (
    <div
      className="group flex flex-col rounded-lg overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      {/* 썸네일 + 제목 — 클릭 시 플레이어로 이동 */}
      <Link href={watchHref} className="flex flex-col flex-1">
        <div className="relative overflow-hidden aspect-video">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {video.duration && (
            <span
              className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.85)", color: "#fff" }}
            >
              {video.duration}
            </span>
          )}
        </div>

        <div className="p-3 flex flex-col gap-1 flex-1">
          <h3
            className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--fg)" }}
          >
            {video.title}
          </h3>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {video.channelTitle}
          </p>
        </div>
      </Link>

      {/* 메타 + 찜하기 버튼 */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          조회 {formatViews(video.viewCount)} · {timeAgo(video.publishedAt)}
        </p>
        {onToggleWishlist && (
          <button
            onClick={onToggleWishlist}
            title={wishlisted ? "찜 해제" : "찜하기"}
            className="transition-transform hover:scale-110 shrink-0"
          >
            <StarIcon filled={wishlisted} />
          </button>
        )}
      </div>
    </div>
  );
}
