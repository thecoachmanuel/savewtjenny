"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronLeft, ShieldCheck } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type InitResponse =
  | { ok: true; authorization_url: string; reference: string }
  | { ok: false; message: string };

type Purpose = "group_contribution" | "personal_savings";

type GroupOption = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
  member_count: number;
};

type GroupMemberWithGroup = {
  group_id: string;
  groups: {
    id: string;
    name: string;
    currency: string | null;
    contribution_amount: number | null;
  } | null;
};

type GoalOption = {
  id: string;
  title: string;
  currency: string;
  target_amount: number;
  saved_amount: number;
};

export default function ContributePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [purpose, setPurpose] = useState<Purpose>("group_contribution");
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [recipient, setRecipient] = useState<{ name: string; label: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPageLoading(true);
      setError(null);

      const urlPurpose = searchParams.get("purpose");
      const initialPurpose: Purpose =
        urlPurpose === "personal_savings" ? "personal_savings" : "group_contribution";
      const urlGroupId = searchParams.get("group_id") ?? "";
      const urlGoalId = searchParams.get("goal_id") ?? "";

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setPageLoading(false);
        setError("Please sign in again.");
        return;
      }

      const groupRows = await supabase
        .from("group_members")
        .select("group_id, groups:groups(id,name,currency,contribution_amount)")
        .eq("user_id", authData.user.id)
        .order("joined_at", { ascending: true })
        .returns<GroupMemberWithGroup[]>();

      const rawGroups =
        groupRows.data?.flatMap((row) => (row.groups ? [row.groups] : [])) ?? [];
      const groupIds = rawGroups.map((g) => g.id);

      const countsResult =
        groupIds.length > 0
          ? await supabase.from("group_members").select("group_id").in("group_id", groupIds)
          : { data: [] as Array<{ group_id: string }> | null };

      const counts = new Map<string, number>();
      for (const row of countsResult.data ?? []) {
        counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
      }

      const mappedGroups: GroupOption[] = rawGroups.map((g) => ({
        id: g.id,
        name: g.name,
        currency: g.currency ?? "NGN",
        contribution_amount: Number(g.contribution_amount ?? 0),
        member_count: counts.get(g.id) ?? 0,
      }));

      const goalsResult = await supabase
        .from("personal_goals")
        .select("id,title,currency,target_amount,saved_amount")
        .eq("user_id", authData.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      const mappedGoals: GoalOption[] =
        goalsResult.data?.map((g) => ({
          id: g.id,
          title: g.title,
          currency: g.currency ?? "NGN",
          target_amount: Number(g.target_amount ?? 0),
          saved_amount: Number(g.saved_amount ?? 0),
        })) ?? [];

      if (cancelled) return;

      setPurpose(initialPurpose);
      setGroups(mappedGroups);
      setGoals(mappedGoals);

      if (initialPurpose === "personal_savings") {
        const initialId = urlGoalId && mappedGoals.some((g) => g.id === urlGoalId) ? urlGoalId : mappedGoals[0]?.id ?? "";
        setSelectedId(initialId);
        setAmount("");
        setRecipient(null);
      } else {
        const initialId = urlGroupId && mappedGroups.some((g) => g.id === urlGroupId) ? urlGroupId : mappedGroups[0]?.id ?? "";
        setSelectedId(initialId);
        const picked = mappedGroups.find((g) => g.id === initialId) ?? null;
        setAmount(picked ? String(Math.round(picked.contribution_amount)) : "");
      }

      setPageLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadRecipient() {
      if (purpose !== "group_contribution" || !selectedId) {
        setRecipient(null);
        return;
      }

      const res = await supabase
        .from("group_members")
        .select("role, profiles:profiles(first_name,last_name)")
        .eq("group_id", selectedId)
        .eq("role", "group_admin")
        .limit(1)
        .maybeSingle<{
          role: string;
          profiles: { first_name: string | null; last_name: string | null } | null;
        }>();

      if (cancelled) return;

      const name =
        (res.data?.profiles?.first_name ?? "Group") +
        (res.data?.profiles?.last_name ? ` ${res.data.profiles.last_name}` : "");
      setRecipient({ name, label: "Group admin" });
    }
    void loadRecipient();
    return () => {
      cancelled = true;
    };
  }, [purpose, selectedId, supabase]);

  async function onContinue() {
    setError(null);
    setLoading(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) {
      setLoading(false);
      setError("Please sign in again.");
      return;
    }

    const resp = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: data.user.email,
        amount: Number(amount),
        purpose,
        group_id: purpose === "group_contribution" ? selectedId : undefined,
        group_name:
          purpose === "group_contribution" ? groups.find((g) => g.id === selectedId)?.name : undefined,
        goal_id: purpose === "personal_savings" ? selectedId : undefined,
      }),
    });

    const json = (await resp.json()) as InitResponse;
    setLoading(false);

    if (!json.ok) {
      setError(json.message);
      return;
    }

    window.location.assign(json.authorization_url);
  }

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-app-fg" />
        </button>
        <div className="text-[15px] font-semibold text-app-fg">
          {purpose === "personal_savings" ? "Add Money" : "Send Contribution"}
        </div>
        <div className="h-10 w-10" />
      </div>

      <Card className="mt-5 px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          {purpose === "personal_savings" ? "Personal goal" : "Group"}
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-app-border bg-white px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold text-app-fg">
              {purpose === "personal_savings"
                ? goals.find((g) => g.id === selectedId)?.title ?? "Select a goal"
                : groups.find((g) => g.id === selectedId)?.name ?? "Select a group"}
            </div>
            <div className="mt-0.5 text-[12px] text-app-muted">
              {purpose === "personal_savings"
                ? `${goals.length} active goals`
                : `${groups.find((g) => g.id === selectedId)?.member_count ?? 0} members`}
            </div>
          </div>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedId(next);
                if (purpose === "group_contribution") {
                  const picked = groups.find((g) => g.id === next) ?? null;
                  setAmount(picked ? String(Math.round(picked.contribution_amount)) : "");
                }
              }}
              disabled={pageLoading || loading}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={purpose === "personal_savings" ? "Select goal" : "Select group"}
            >
              {(purpose === "personal_savings" ? goals : groups).map((o) => (
                <option key={o.id} value={o.id}>
                  {"title" in o ? o.title : o.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-app-muted" />
          </div>
        </div>

        {purpose === "group_contribution" ? (
          <>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
              Recipient
            </div>
            <div className="mt-2 flex items-center justify-between rounded-2xl border border-app-border bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-app-bg" />
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">
                    {recipient?.name ?? "Group"}
                  </div>
                  <div className="mt-0.5 text-[12px] text-app-muted">
                    {recipient?.label ?? "Recipient"}
                  </div>
                </div>
              </div>
              <div className="rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-semibold text-app-primary">
                NGN
              </div>
            </div>
          </>
        ) : null}

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Contribution
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-app-border bg-white px-4 py-3">
          <div className="text-[14px] font-semibold text-app-fg">₦</div>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="h-10 border-0 bg-transparent px-0 text-[18px] font-semibold focus:ring-0"
            aria-label="Amount"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Due today</div>
              <div className="mt-0.5 text-amber-800">
                Your contribution is due today. Pay now to stay on track.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <Button className="w-full" onClick={onContinue} disabled={loading || pageLoading || !selectedId || !amount}>
          {loading ? "Opening Paystack..." : "Continue"}
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-app-muted">
        <ShieldCheck className="h-4 w-4 text-app-primary" />
        Secure payment powered by Paystack
      </div>
    </div>
  );
}
