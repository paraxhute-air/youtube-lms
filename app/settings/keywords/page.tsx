import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { KeywordManager } from "@/components/settings/KeywordManager";

export default async function KeywordsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "user";

  const { data: keywords } = await supabase
    .from("search_keywords")
    .select("*")
    .order("sort_order");

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={displayName} />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-[var(--accent)] font-bold text-lg">
              <span className="text-[var(--muted)]">$ </span>settings/keywords
            </h1>
            <p className="text-[var(--muted)] text-xs mt-1">
              큐레이션 검색 키워드를 관리합니다
            </p>
          </div>
          <KeywordManager initialKeywords={keywords ?? []} />
        </div>
      </main>
    </div>
  );
}
