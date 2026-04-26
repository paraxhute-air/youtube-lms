"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  videoId: string;
  userId: string;
  initialPosition: number;
  initialStatus: "todo" | "doing" | "done";
  initialWatchSeconds: number;
}

// YT IFrame API를 any로 타입 처리 (UMD 글로벌 제약 회피)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YTPlayer = any;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YoutubePlayer({
  videoId,
  userId,
  initialPosition,
  initialStatus,
  initialWatchSeconds,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer>(null);
  const watchedRef = useRef(initialStatus === "done");
  const watchSecondsRef = useRef(initialWatchSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaveRef = useRef(Date.now());
  const supabase = useMemo(() => createClient(), []);

  const upsertLog = useCallback(
    async (position: number, status?: "todo" | "doing" | "done") => {
      await supabase.from("video_logs").upsert(
        {
          user_id: userId,
          video_id: videoId,
          last_position: position,
          watch_seconds: watchSecondsRef.current,
          updated_at: new Date().toISOString(),
          ...(status ? { status } : {}),
        },
        { onConflict: "user_id,video_id" },
      );
    },
    [supabase, userId, videoId],
  );

  const saveProgress = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const current: number = player.getCurrentTime?.() ?? 0;
      const duration: number = player.getDuration?.() ?? 0;
      const ratio = duration > 0 ? current / duration : 0;

      if (!watchedRef.current && ratio >= 0.8) {
        watchedRef.current = true;
        await upsertLog(current, "done");
      } else {
        await upsertLog(current);
      }
      lastSaveRef.current = Date.now();
    } catch (err) {
      console.error("[YoutubePlayer] saveProgress failed:", err);
    }
  }, [upsertLog]);

  useEffect(() => {
    function initPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          start: Math.floor(initialPosition),
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            if (initialStatus === "todo") {
              upsertLog(initialPosition, "doing");
            }
          },
          onStateChange: (e: { data: number }) => {
            const YTState = window.YT?.PlayerState;
            if (!YTState) return;

            if (e.data === YTState.PLAYING) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(async () => {
                const player = playerRef.current;
                if (!player || player.getPlayerState() !== YTState.PLAYING) {
                  clearInterval(intervalRef.current!);
                  intervalRef.current = null;
                  return;
                }
                watchSecondsRef.current += 10;
                await saveProgress();
              }, 10000);
            }

            if (e.data === YTState.ENDED) {
              watchedRef.current = true;
              upsertLog(0, "done");
            }
          },
        },
      });
    }

    // YouTube IFrame API 로드
    if (window.YT?.Player) {
      initPlayer();
    } else {
      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    function handleBeforeUnload() {
      saveProgress();
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        saveProgress();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      saveProgress();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      playerRef.current?.destroy?.();
    };
  }, [videoId, initialPosition, initialStatus, saveProgress, upsertLog]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}
