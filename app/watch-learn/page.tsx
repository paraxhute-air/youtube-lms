import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { CurationClient } from "@/components/curation/CurationClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { FilterItem } from "@/components/curation/CurationClient";

export default async function CurationPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "user";

  const [{ data: keywordRows }, { data: channelRows }] = await Promise.all([
    supabase
      .from("search_keywords")
      .select("keyword")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("search_channels")
      .select("channel_name, channel_id")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const keywords = (keywordRows ?? []).map((r) => ({
    kind: "keyword" as const,
    label: r.keyword,
  }));
  const channels = (channelRows ?? [])
    .filter((r) => r.channel_id)
    .map((r) => ({
      kind: "channel" as const,
      label: r.channel_name ?? r.channel_id!,
      channelId: r.channel_id!,
    }));

  const subFilters = [...keywords, ...channels];
  const filters: FilterItem[] = subFilters.length > 0
    ? [{ kind: "all" as const, label: "all" }, ...subFilters]
    : [];

  const isEmpty = filters.length === 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={displayName} />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[var(--accent)] font-bold text-lg">
                <span className="text-[var(--muted)]">$ </span>curation
              </h1>
              <p className="text-[var(--muted)] text-xs mt-1">AI 학습 영상 큐레이션</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/settings/keywords"
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                ⚙ 키워드
              </Link>
              <Link
                href="/settings/channels"
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                ⚙ 채널
              </Link>
            </div>
          </div>

          {isEmpty ? (
            <div
              className="rounded-lg p-8 text-center"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
            >
              <p className="text-[var(--muted)] text-sm mb-3">
                등록된 키워드나 채널이 없습니다
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/settings/keywords" className="text-[var(--accent)] text-xs hover:underline">
                  키워드 추가 →
                </Link>
                <Link href="/settings/channels" className="text-[var(--accent-2)] text-xs hover:underline">
                  채널 추가 →
                </Link>
              </div>
            </div>
          ) : (
            <CurationClient filters={filters} userId={user.id} />
          )}
        </div>
      </main>
    </div>
  );
}
