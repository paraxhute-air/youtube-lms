"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoCard } from "./VideoCard";
import type { YoutubeVideo } from "@/app/api/youtube/route";

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

export type FilterItem =
  | { kind: "all"; label: string }
  | { kind: "keyword"; label: string }
  | { kind: "channel"; label: string; channelId: string };

type SortOrder = "relevance" | "date" | "viewCount";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "relevance", label: "관련순" },
  { value: "date",      label: "최신순" },
  { value: "viewCount", label: "조회순" },
];

// slate-600 계열 색상 (테마 변수 없이 고정)
const SORT_ACTIVE_BG    = "#475569"; // slate-600
const SORT_ACTIVE_COLOR = "#f1f5f9"; // slate-100

async function fetchSingle(
  filter: FilterItem,
  order: SortOrder,
  year: string,
  month: string,
  lang: string,
  maxResults = 20
): Promise<YoutubeVideo[]> {
  if (filter.kind === "all") return [];
  const param =
    filter.kind === "channel"
      ? `channelId=${encodeURIComponent(filter.channelId)}`
      : `keyword=${encodeURIComponent(filter.label)}`;
  
  const searchParams = new URLSearchParams(param);
  searchParams.set("order", order);
  searchParams.set("maxResults", maxResults.toString());
  if (year) searchParams.set("year", year);
  if (month) searchParams.set("month", month);
  if (lang) searchParams.set("lang", lang);

  const res = await fetch(`/api/youtube?${searchParams.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.videos ?? [];
}

async function fetchAll(
  filters: FilterItem[],
  order: SortOrder,
  year: string,
  month: string,
  lang: string
): Promise<YoutubeVideo[]> {
  const sub = filters.filter((f) => f.kind !== "all").slice(0, 5);
  const results = await Promise.all(sub.map((f) => fetchSingle(f, order, year, month, lang, 8)));

  const seen = new Set<string>();
  const merged: YoutubeVideo[] = [];
  for (const list of results) {
    for (const v of list) {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        merged.push(v);
      }
    }
  }

  if (order === "viewCount") {
    merged.sort((a, b) => parseInt(b.viewCount) - parseInt(a.viewCount));
  } else if (order === "date") {
    merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  return merged;
}

/**
 * 다중선택 지원 FilterChips
 * - "all" 버튼: 단독 선택, 클릭 시 나머지 모두 해제
 * - keyword/channel 버튼: 다중선택 가능, 하나라도 선택되면 "all" 해제
 */
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
  isAll,
  onChange,
}: {
  current: SortOrder;
  isAll: boolean;
  onChange: (s: SortOrder) => void;
}) {
  const options = isAll
    ? SORT_OPTIONS.filter((o) => o.value !== "relevance")
    : SORT_OPTIONS;

  return (
    <div className="flex gap-1">
      {options.map((o) => (
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

export function WatchLearnClient({ filters, userId }: { filters: FilterItem[]; userId: string }) {
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set([0]));
  const [sort, setSort] = useState<SortOrder>("relevance");
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [lang, setLang] = useState<string>("ko");
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setWishlistedIds(loadWishlist(userId));
  }, [userId]);

  function toggleWishlist(videoId: string) {
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      saveWishlist(userId, next);
      return next;
    });
  }

  const isAll = selectedIdxs.size === 1 && selectedIdxs.has(0) && filters[0]?.kind === "all";

  const load = useCallback(
    async (idxs: Set<number>, order: SortOrder, y: string, m: string, l: string) => {
      if (idxs.size === 0) {
        setVideos([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // all 버튼이 선택된 경우
        if (idxs.has(0) && filters[0]?.kind === "all") {
          const result = await fetchAll(filters, order, y, m, l);
          setVideos(result);
          return;
        }
        // 다중 선택된 필터들을 병렬 fetch
        const selectedFilters = Array.from(idxs)
          .map((i) => filters[i])
          .filter((f): f is FilterItem => !!f && f.kind !== "all");

        const perMax = selectedFilters.length > 1 ? 8 : 20;
        const results = await Promise.all(
          selectedFilters.map((f) => fetchSingle(f, order, y, m, l, perMax))
        );
        const seen = new Set<string>();
        const merged: YoutubeVideo[] = [];
        for (const list of results) {
          for (const v of list) {
            if (!seen.has(v.id)) {
              seen.add(v.id);
              merged.push(v);
            }
          }
        }
        if (order === "viewCount") {
          merged.sort((a, b) => parseInt(b.viewCount) - parseInt(a.viewCount));
        } else if (order === "date") {
          merged.sort(
            (a, b) =>
              new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          );
        }
        setVideos(merged);
      } catch {
        setError("영상을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  function handleToggle(idx: number) {
    setSelectedIdxs((prev) => {
      const next = new Set(prev);
      const clickedKind = filters[idx]?.kind;

      // "all" 클릭: 단독 선택
      if (clickedKind === "all") {
        const newSet = new Set([0]);
        const nextSort = "date";
        setSort(nextSort);
        load(newSet, nextSort, year, month, lang);
        return newSet;
      }

      // keyword/channel 클릭: 다중선택
      // "all"(idx=0)이 선택되어 있으면 제거
      next.delete(0);

      if (next.has(idx)) {
        next.delete(idx);
        // 아무것도 선택 안 되면 "all"로 복귀
        if (next.size === 0) {
          next.add(0);
          const nextSort = "date";
          setSort(nextSort);
          load(next, nextSort, year, month, lang);
          return next;
        }
      } else {
        next.add(idx);
      }

      // 정렬: keyword가 하나라도 있으면 relevance 허용
      const hasKeyword = Array.from(next).some(
        (i) => filters[i]?.kind === "keyword"
      );
      const nextSort = hasKeyword ? sort : (sort === "relevance" ? "date" : sort);
      if (!hasKeyword && sort === "relevance") setSort("date");
      load(next, nextSort, year, month, lang);
      return next;
    });
  }

  function handleSortChange(order: SortOrder) {
    setSort(order);
    load(selectedIdxs, order, year, month, lang);
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setYear(val);
    if (!val) setMonth("");
    load(selectedIdxs, sort, val, val ? month : "", lang);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setMonth(val);
    load(selectedIdxs, sort, year, val, lang);
  }

  function handleLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLang(val);
    load(selectedIdxs, sort, year, month, val);
  }

  useEffect(() => {
    const initSort = filters[0]?.kind === "all" ? "date" : "relevance";
    setSort(initSort);
    // lang init "ko"
    load(new Set([0]), initSort, year, month, lang);
  }, [filters, load]); // year, month, lang are dependencies inside handle functions, not load directly to avoid loop here? Wait, load is stable because it doesn't have year/month as deps.

  // 결과 설명 텍스트 생성
  const selectedLabels = Array.from(selectedIdxs)
    .map((i) => filters[i])
    .filter((f): f is FilterItem => !!f && f.kind !== "all")
    .map((f) => f.label);

  return (
    <div className="space-y-4">
      {/* 필터 + 정렬 */}
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
          <SortButtons current={sort} isAll={isAll} onChange={handleSortChange} />
        </div>
        <FilterChips filters={filters} selectedIdxs={selectedIdxs} onToggle={handleToggle} />
        <div className="flex flex-wrap gap-2 pt-2 border-t mt-2" style={{ borderColor: "var(--border)" }}>
          <select 
            value={lang} 
            onChange={handleLangChange}
            className="px-2 py-1 text-xs rounded outline-none cursor-pointer"
            style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)" }}
          >
            <option value="ko">한국어</option>
            <option value="en">영어</option>
            <option value="all">전체 언어</option>
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

      {/* 결과 */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <div
          className="px-4 py-3 rounded text-sm"
          style={{ background: "var(--danger)22", border: "1px solid var(--danger)44", color: "var(--danger)" }}
        >
          ✗ {error}
        </div>
      ) : (
        <>
          <p className="text-[var(--muted)] text-xs">
            <span style={{ color: "var(--accent-2)" }}>{videos.length}</span>개 결과
            {selectedLabels.length > 0 && (
              <> · {selectedLabels.map((l) => `"${l}"`).join(", ")}</>
            )}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                wishlisted={wishlistedIds.has(v.id)}
                onToggleWishlist={() => toggleWishlist(v.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
