"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { VideoCard } from "./VideoCard";
import type { YoutubeVideo } from "@/app/api/youtube/route";

const hasKo = (s: string) => /[가-힣]/.test(s);
const isKoreanVideo = (v: { title: string; channelTitle: string }) =>
  hasKo(v.title) || hasKo(v.channelTitle);

// ── wishlist helpers ──────────────────────────────────────────
function loadWishlist(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`wishlist_${userId}`);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function saveWishlist(userId: string, ids: Set<string>) {
  localStorage.setItem(`wishlist_${userId}`, JSON.stringify([...ids]));
}

// ── types ────────────────────────────────────────────────────
export type FilterItem =
  | { kind: "all"; label: string }
  | { kind: "keyword"; label: string }
  | { kind: "channel"; label: string; channelId: string };

type SortOrder = "date" | "viewCount";

function filterKey(f: FilterItem): string {
  if (f.kind === "channel") return `ch:${f.channelId}`;
  return `kw:${f.label}`;
}

// ── fetch ─────────────────────────────────────────────────────
async function fetchSingle(
  filter: FilterItem,
  order: SortOrder,
  year: string,
  month: string,
  lang: string,
  maxResults = 20,
  pageToken?: string,
): Promise<{ videos: YoutubeVideo[]; nextPageToken: string | null }> {
  if (filter.kind === "all") return { videos: [], nextPageToken: null };

  const params = new URLSearchParams(
    filter.kind === "channel"
      ? `channelId=${encodeURIComponent(filter.channelId)}`
      : `keyword=${encodeURIComponent(filter.label)}`,
  );
  params.set("order", order);
  params.set("maxResults", String(maxResults));
  if (year)      params.set("year", year);
  if (month)     params.set("month", month);
  const apiLang = lang === "global" ? "en" : lang;
  if (apiLang)   params.set("lang", apiLang);
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`/api/youtube?${params}`);
  if (!res.ok) return { videos: [], nextPageToken: null };
  const data = await res.json();
  return { videos: data.videos ?? [], nextPageToken: data.nextPageToken ?? null };
}

// ── sort options ──────────────────────────────────────────────
const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "date",      label: "최신순" },
  { value: "viewCount", label: "조회순" },
];
const SORT_ACTIVE_BG    = "#475569";
const SORT_ACTIVE_COLOR = "#f1f5f9";

// ── sub-components ────────────────────────────────────────────
function FilterChips({
  filters,
  selectedIdxs,
  onToggle,
}: {
  filters: FilterItem[];
  selectedIdxs: Set<number>;
  onToggle: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f, idx) => {
        const active = selectedIdxs.has(idx);
        const color =
          f.kind === "all"
            ? "var(--muted)"
            : f.kind === "channel"
              ? "var(--accent-2)"
              : "var(--accent)";
        return (
          <button
            key={idx}
            onClick={() => onToggle(idx)}
            className="px-3 py-1 rounded text-xs font-medium transition-all"
            style={{
              background: active ? color : "var(--bg-hover)",
              color: active ? "var(--bg)" : "var(--muted)",
              border: `1px solid ${active ? color : "var(--border)"}`,
            }}
          >
            {f.kind === "all" && active && "● "}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function SortButtons({
  current,
  onChange,
}: {
  current: SortOrder;
  onChange: (s: SortOrder) => void;
}) {
  return (
    <div className="flex gap-1">
      {SORT_OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="px-2 py-0.5 rounded text-xs transition-colors"
          style={{
            background: current === o.value ? SORT_ACTIVE_BG : "var(--bg-hover)",
            color: current === o.value ? SORT_ACTIVE_COLOR : "var(--muted)",
            border: `1px solid ${current === o.value ? SORT_ACTIVE_BG : "var(--border)"}`,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SkeletonGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="rounded-lg overflow-hidden animate-pulse"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <div className="w-full aspect-video bg-[var(--bg-hover)]" />
        <div className="p-3 space-y-2">
          <div className="h-3 rounded bg-[var(--bg-hover)] w-full" />
          <div className="h-3 rounded bg-[var(--bg-hover)] w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonRow = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="rounded-lg overflow-hidden animate-pulse"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <div className="w-full aspect-video bg-[var(--bg-hover)]" />
        <div className="p-3 space-y-2">
          <div className="h-3 rounded bg-[var(--bg-hover)] w-full" />
          <div className="h-3 rounded bg-[var(--bg-hover)] w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

// ── main component ────────────────────────────────────────────
export function WatchLearnClient({ filters, userId }: { filters: FilterItem[]; userId: string }) {
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set([0]));
  const [sort, setSort]   = useState<SortOrder>("date");
  const [year, setYear]   = useState("");
  const [month, setMonth] = useState("");
  const [lang, setLang]   = useState<"all" | "ko" | "global">("all");
  const [videos, setVideos]   = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  // mutable refs — read by IntersectionObserver without stale closures
  const pageTokensRef   = useRef<Map<string, string | null>>(new Map());
  const seenIdsRef      = useRef<Set<string>>(new Set());
  const reqIdRef        = useRef(0);
  const loadingRef      = useRef(false);
  const hasMoreRef      = useRef(false);
  const selectedIdxsRef = useRef(selectedIdxs);
  const sortRef         = useRef(sort);
  const yearRef         = useRef(year);
  const monthRef        = useRef(month);
  const langRef         = useRef(lang);
  const loaderRef       = useRef<HTMLDivElement>(null);

  // sync state → refs (for handler-mutated values)
  useEffect(() => { selectedIdxsRef.current = selectedIdxs; }, [selectedIdxs]);
  useEffect(() => { sortRef.current  = sort;  }, [sort]);
  useEffect(() => { yearRef.current  = year;  }, [year]);
  useEffect(() => { monthRef.current = month; }, [month]);
  useEffect(() => { langRef.current  = lang;  }, [lang]);

  useEffect(() => { setWishlistedIds(loadWishlist(userId)); }, [userId]);

  const displayedVideos = useMemo(() => {
    if (lang === "ko") return videos.filter(isKoreanVideo);
    if (lang === "global") return videos.filter(v => !isKoreanVideo(v));
    return videos;
  }, [videos, lang]);

  function toggleWishlist(videoId: string) {
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      next.has(videoId) ? next.delete(videoId) : next.add(videoId);
      saveWishlist(userId, next);
      return next;
    });
  }

  const load = useCallback(async (
    idxs: Set<number>,
    order: SortOrder,
    y: string, m: string, l: string,
    append: boolean,
  ) => {
    if (idxs.size === 0) {
      setVideos([]);
      setHasMore(false);
      hasMoreRef.current = false;
      return;
    }

    // reset pagination state on fresh load
    if (!append) {
      pageTokensRef.current = new Map();
      seenIdsRef.current    = new Set();
    }

    const myId = ++reqIdRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const isAllMode = idxs.has(0) && filters[0]?.kind === "all";
      const subFilters: FilterItem[] = isAllMode
        ? filters.filter((f) => f.kind !== "all").slice(0, 5)
        : (Array.from(idxs).map((i) => filters[i]).filter((f): f is FilterItem => !!f && f.kind !== "all"));

      if (subFilters.length === 0) {
        setVideos([]);
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      const perMax = isAllMode ? 20 : (subFilters.length > 1 ? 10 : 20);

      // on append, only fetch filters that still have a token
      const toFetch = append
        ? subFilters.filter((f) => pageTokensRef.current.get(filterKey(f)) !== null)
        : subFilters;

      if (append && toFetch.length === 0) {
        const newHasMore = false;
        hasMoreRef.current = newHasMore;
        setHasMore(newHasMore);
        return;
      }

      const results = await Promise.all(
        toFetch.map((f) =>
          fetchSingle(
            f, order, y, m, l, perMax,
            append ? (pageTokensRef.current.get(filterKey(f)) ?? undefined) : undefined,
          ),
        ),
      );

      // stale request guard
      if (myId !== reqIdRef.current) return;

      // update page tokens
      const newTokens = new Map(pageTokensRef.current);
      if (!append) {
        // initialize all subFilters to null; actual values set below
        subFilters.forEach((f) => newTokens.set(filterKey(f), null));
      }
      toFetch.forEach((f, i) => newTokens.set(filterKey(f), results[i].nextPageToken));
      pageTokensRef.current = newTokens;

      // dedup merge
      const seen = seenIdsRef.current;
      const merged: YoutubeVideo[] = [];
      for (const r of results) {
        for (const v of r.videos) {
          if (!seen.has(v.id)) {
            seen.add(v.id);
            merged.push(v);
          }
        }
      }
      seenIdsRef.current = seen;

      if (order === "viewCount") {
        merged.sort((a, b) => parseInt(b.viewCount) - parseInt(a.viewCount));
      } else if (order === "date") {
        merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

      setVideos((prev) => append ? [...prev, ...merged] : merged);

      const newHasMore = [...newTokens.values()].some((t) => t !== null);
      hasMoreRef.current = newHasMore;
      setHasMore(newHasMore);
    } catch {
      if (myId === reqIdRef.current) {
        setError("영상을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      if (myId === reqIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [filters]);

  // IntersectionObserver — triggers append load when sentinel enters viewport
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          load(
            selectedIdxsRef.current,
            sortRef.current,
            yearRef.current,
            monthRef.current,
            langRef.current,
            true,
          );
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  // ── event handlers ──────────────────────────────────────────
  function handleToggle(idx: number) {
    setSelectedIdxs((prev) => {
      const next   = new Set(prev);
      const kind   = filters[idx]?.kind;

      if (kind === "all") {
        const newSet   = new Set([0]);
        const nextSort: SortOrder = "date";
        setSort(nextSort);
        load(newSet, nextSort, year, month, lang, false);
        return newSet;
      }

      next.delete(0);
      if (next.has(idx)) {
        next.delete(idx);
        if (next.size === 0) {
          next.add(0);
          const nextSort: SortOrder = "date";
          setSort(nextSort);
          load(next, nextSort, year, month, lang, false);
          return next;
        }
      } else {
        next.add(idx);
      }

      load(next, sort, year, month, lang, false);
      return next;
    });
  }

  function handleSortChange(order: SortOrder) {
    setSort(order);
    load(selectedIdxs, order, year, month, lang, false);
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setYear(val);
    if (!val) setMonth("");
    load(selectedIdxs, sort, val, val ? month : "", lang, false);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setMonth(val);
    load(selectedIdxs, sort, year, val, lang, false);
  }

  function handleLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLang(val);
    load(selectedIdxs, sort, year, month, val, false);
  }

  // initial load
  useEffect(() => {
    load(new Set([0]), "date", "", "", "all", false);
  }, [filters, load]);

  // ── render ──────────────────────────────────────────────────
  const selectedLabels = Array.from(selectedIdxs)
    .map((i) => filters[i])
    .filter((f): f is FilterItem => !!f && f.kind !== "all")
    .map((f) => f.label);

  return (
    <div className="space-y-4">
      {/* filter + sort panel */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-[var(--muted)] text-xs">
              <span className="text-[var(--accent)]">▸</span> filter
            </p>
            <span className="text-[var(--muted)] text-xs hidden sm:block">
              <span className="text-[var(--accent)]">■</span> keyword
              <span className="ml-2 text-[var(--accent-2)]">■</span> channel
            </span>
          </div>
          <SortButtons current={sort} onChange={handleSortChange} />
        </div>

        <FilterChips filters={filters} selectedIdxs={selectedIdxs} onToggle={handleToggle} />

        <div
          className="flex flex-wrap gap-2 pt-2 border-t mt-2"
          style={{ borderColor: "var(--border)" }}
        >
          <select
            value={lang}
            onChange={handleLangChange}
            className="px-2 py-1 text-xs rounded outline-none cursor-pointer"
            style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)" }}
          >
            <option value="all">모두보기</option>
            <option value="ko">한국</option>
            <option value="global">글로벌</option>
          </select>

          <select
            value={year}
            onChange={handleYearChange}
            className="px-2 py-1 text-xs rounded outline-none cursor-pointer"
            style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)" }}
          >
            <option value="">연도 전체</option>
            <option value="2026">2026년</option>
            <option value="2025">2025년</option>
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
            <option value="2022">2022년</option>
            <option value="2021">2021년</option>
          </select>

          {year && (
            <select
              value={month}
              onChange={handleMonthChange}
              className="px-2 py-1 text-xs rounded outline-none cursor-pointer"
              style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)" }}
            >
              <option value="">월 전체</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {i + 1}월
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* result count */}
      {!loading && displayedVideos.length > 0 && (
        <p className="text-[var(--muted)] text-xs">
          <span style={{ color: "var(--accent-2)" }}>{displayedVideos.length}</span>개 결과
          {selectedLabels.length > 0 && (
            <> · {selectedLabels.map((l) => `"${l}"`).join(", ")}</>
          )}
        </p>
      )}

      {/* video grid */}
      {loading && videos.length === 0 ? (
        <SkeletonGrid />
      ) : error ? (
        <div
          className="px-4 py-3 rounded text-sm"
          style={{
            background: "var(--danger)22",
            border: "1px solid var(--danger)44",
            color: "var(--danger)",
          }}
        >
          ✗ {error}
        </div>
      ) : displayedVideos.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <p className="text-[var(--muted)] text-sm">
            {videos.length > 0 ? "이 필터에 맞는 영상이 없습니다" : "결과가 없습니다"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedVideos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              wishlisted={wishlistedIds.has(v.id)}
              onToggleWishlist={() => toggleWishlist(v.id)}
              subtitlesEnabled={!isKoreanVideo(v)}
            />
          ))}
        </div>
      )}

      {/* append skeleton */}
      {loading && videos.length > 0 && <SkeletonRow />}

      {/* end of results */}
      {!loading && !hasMore && videos.length > 0 && (
        <p className="text-center text-xs py-4" style={{ color: "var(--muted)" }}>
          — 끝 —
        </p>
      )}

      {/* IntersectionObserver sentinel — always mounted */}
      <div ref={loaderRef} className="h-1" />
    </div>
  );
}
