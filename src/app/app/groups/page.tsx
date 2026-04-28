"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type GroupRow = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
};

export default function GroupsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [groups, setGroups] = useState<Array<GroupRow & { member_count: number }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGroups() {
      setLoadingGroups(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoadingGroups(false);
        return;
      }

      const rows = await supabase
        .from("group_members")
        .select("groups:groups(id,name,currency,contribution_amount)")
        .eq("user_id", userData.user.id)
        .order("joined_at", { ascending: false })
        .returns<Array<{ groups: GroupRow | null }>>();

      const rawGroups = (rows.data ?? []).flatMap((r) => (r.groups ? [r.groups] : []));
      const ids = rawGroups.map((g) => g.id);

      const members =
        ids.length > 0
          ? await supabase.from("group_members").select("group_id").in("group_id", ids)
          : { data: [] as Array<{ group_id: string }> | null };

      const counts = new Map<string, number>();
      for (const row of members.data ?? []) {
        counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
      }

      if (cancelled) return;
      setGroups(
        rawGroups.map((g) => ({
          ...g,
          member_count: counts.get(g.id) ?? 0,
        })),
      );
      setLoadingGroups(false);
    }
    void loadGroups();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onJoin() {
    setError(null);
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      setError("Please sign in again.");
      return;
    }
    const resp = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invite_code: code }),
    });
    const json = (await resp.json()) as { ok: boolean; id?: string; message?: string };
    setLoading(false);
    if (!json.ok || !json.id) {
      setError(json.message ?? "Could not join group.");
      return;
    }
    setJoinOpen(false);
    router.replace(`/app/groups/${json.id}`);
  }

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-10">
      <div className="text-[16px] font-semibold text-app-fg">Savings Groups</div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/app/groups/create">
          <Button className="w-full" variant="primary">
            Create group
          </Button>
        </Link>
        <Button className="w-full" variant="outline" onClick={() => setJoinOpen(true)}>
          Join group
        </Button>
      </div>

      <div className="mt-7 text-center text-[12px] text-app-muted">
        {loadingGroups ? "Loading your groups..." : groups.length ? "Your groups" : "You don&apos;t have a savings group"}
      </div>
      <div className="mt-1 text-center text-[12px] text-app-muted">
        {groups.length ? "Tap a group to view details." : "Start your savings journey by joining or creating a group."}
      </div>

      <div className="mt-5 space-y-3">
        {groups.map((g) => (
          <Link key={g.id} href={`/app/groups/${g.id}`}>
            <Card className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">{g.name}</div>
                  <div className="mt-1 text-[12px] text-app-muted">
                    {g.member_count ? `${g.member_count} members` : "New group"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-app-muted">Contribution</div>
                  <div className="mt-1 text-[13px] font-semibold text-app-fg">
                    {formatMoney(Number(g.contribution_amount ?? 0), g.currency ?? "NGN")}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {joinOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-3 pb-3">
          <div className="w-full max-w-[430px] rounded-[24px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between px-5 pt-4">
              <div className="text-[14px] font-semibold text-app-fg">Join a Savings Group</div>
              <button
                type="button"
                onClick={() => setJoinOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-app-bg"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-app-muted" />
              </button>
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="text-[12px] font-medium text-app-muted">Enter group code</div>
              <Input
                className="mt-2"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ASDF-1234-QWER"
              />

              <div className="mt-3">
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!code || loading}
                  onClick={onJoin}
                >
                  {loading ? "Checking..." : "Search group"}
                </Button>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                  {error}
                </div>
              ) : null}

              <Button className="mt-4 w-full" disabled={!code || loading} onClick={onJoin}>
                Join group
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
