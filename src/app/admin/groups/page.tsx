import Link from "next/link";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GroupRow = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
  cycle_frequency: string;
  total_cycles: number;
  invite_code: string;
  created_at: string;
};

type MemberRow = {
  user_id: string;
  role: string;
  position: number;
  joined_at: string;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

type ContributionRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams?: { group_id?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const selectedGroupId = searchParams?.group_id ?? null;

  function addFrequency(base: Date, frequency: string, count: number) {
    const d = new Date(base);
    if (count <= 0) return d;
    const f = (frequency ?? "").toLowerCase();
    if (f === "weekly") {
      d.setDate(d.getDate() + 7 * count);
      return d;
    }
    if (f === "daily") {
      d.setDate(d.getDate() + count);
      return d;
    }
    d.setMonth(d.getMonth() + count);
    return d;
  }

  function getCycleWindow(startAt: Date, frequency: string) {
    const now = new Date();
    let start = new Date(startAt);
    let end = addFrequency(start, frequency, 1);
    let idx = 0;
    while (now.getTime() >= end.getTime() && idx < 10_000) {
      start = end;
      end = addFrequency(start, frequency, 1);
      idx++;
    }
    return { idx, start, end };
  }
  const { data } = await supabase
    .from("groups")
    .select("id,name,currency,contribution_amount,cycle_frequency,total_cycles,invite_code,created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .limit(50)
    .returns<GroupRow[]>();

  const selectedGroup = selectedGroupId ? (data ?? []).find((g) => g.id === selectedGroupId) ?? null : null;

  const members =
    selectedGroupId && selectedGroup
      ? await supabase
          .from("group_members")
          .select("user_id,role,position,joined_at,profiles:profiles(first_name,last_name,email)")
          .eq("group_id", selectedGroupId)
          .order("position", { ascending: true })
          .order("joined_at", { ascending: true })
          .returns<MemberRow[]>()
      : null;

  const cycleWindow =
    selectedGroupId && selectedGroup ? getCycleWindow(new Date(selectedGroup.created_at), selectedGroup.cycle_frequency) : null;

  const cyclePaid =
    selectedGroupId && selectedGroup && cycleWindow
      ? await supabase
          .from("contributions")
          .select("user_id")
          .eq("group_id", selectedGroupId)
          .eq("status", "paid")
          .gte("created_at", cycleWindow.start.toISOString())
          .lt("created_at", cycleWindow.end.toISOString())
          .returns<Array<{ user_id: string }>>()
      : null;

  const paidIds = new Set((cyclePaid?.data ?? []).map((r) => r.user_id));

  const contributions =
    selectedGroupId && selectedGroup
      ? await supabase
          .from("contributions")
          .select("id,user_id,amount,currency,status,created_at,profiles:profiles(first_name,last_name,email)")
          .eq("group_id", selectedGroupId)
          .order("created_at", { ascending: false })
          .limit(25)
          .returns<ContributionRow[]>()
      : null;

  const paidCountResult =
    selectedGroupId && selectedGroup
      ? await supabase
          .from("contributions")
          .select("id", { count: "exact", head: true })
          .eq("group_id", selectedGroupId)
          .eq("status", "paid")
      : null;
  const paidCount = paidCountResult?.count ?? 0;
  const memberCount = members?.data?.length ?? 0;
  const estimatedCycle = memberCount > 0 ? Math.floor(paidCount / memberCount) + 1 : 1;
  const currentCycleNumber = cycleWindow ? Math.min(cycleWindow.idx + 1, selectedGroup?.total_cycles ?? 1) : 1;
  const orderedMembers = [...(members?.data ?? [])].sort((a, b) => a.position - b.position);
  const payoutTarget =
    orderedMembers.length > 0 ? orderedMembers[(currentCycleNumber - 1) % orderedMembers.length] : null;
  const payoutTargetName =
    payoutTarget?.profiles
      ? (payoutTarget.profiles.first_name ?? "Member") +
        (payoutTarget.profiles.last_name ? ` ${payoutTarget.profiles.last_name}` : "")
      : "-";
  const paidThisCycle = paidIds.size;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-[14px] font-semibold text-app-fg">Groups</div>
          <div className="mt-1 text-[12px] text-app-muted">Latest 50</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-app-bg text-app-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Contribution</th>
                <th className="px-5 py-3 font-semibold">Frequency</th>
                <th className="px-5 py-3 font-semibold">Invite</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((g) => {
                const isActive = g.id === selectedGroupId;
                return (
                  <tr key={g.id} className="border-t border-app-border">
                    <td className="px-5 py-3 font-semibold text-app-fg">
                      <Link
                        href={`/admin/groups?group_id=${encodeURIComponent(g.id)}`}
                        className={isActive ? "text-app-primary" : "text-app-fg"}
                      >
                        {g.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-app-fg">
                      {formatMoney(Number(g.contribution_amount), g.currency ?? "NGN")}
                    </td>
                    <td className="px-5 py-3 text-app-fg">
                      {g.cycle_frequency} · {g.total_cycles} cycles
                    </td>
                    <td className="px-5 py-3 font-semibold text-app-fg">{g.invite_code}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedGroup ? (
        <Card className="overflow-hidden">
          <div className="px-5 py-4">
            <div className="text-[14px] font-semibold text-app-fg">{selectedGroup.name}</div>
            <div className="mt-1 text-[12px] text-app-muted">
              {memberCount} members · {paidCount} paid contributions · Estimated cycle #{estimatedCycle}
            </div>
            {cycleWindow ? (
              <div className="mt-1 text-[12px] text-app-muted">
                Cycle #{currentCycleNumber} ·{" "}
                {cycleWindow.start.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} –{" "}
                {cycleWindow.end.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} · Paid{" "}
                {paidThisCycle}/{Math.max(memberCount, 0)} · Payout target: {payoutTargetName}
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 px-5 pb-5 md:grid-cols-2">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-app-muted">
                Members
              </div>
              <div className="mt-2 space-y-2">
                {(members?.data ?? []).slice(0, 10).map((m) => {
                  const name =
                    (m.profiles?.first_name ?? "Member") +
                    (m.profiles?.last_name ? ` ${m.profiles.last_name}` : "");
                  const paid = paidIds.has(m.user_id);
                  return (
                    <div key={m.user_id} className="rounded-2xl border border-app-border bg-white px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-app-fg">{name}</div>
                          <div className="mt-0.5 text-[12px] text-app-muted">
                            {m.profiles?.email ?? "-"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[12px] font-semibold text-app-fg">#{m.position}</div>
                          <div className="mt-0.5 text-[12px] text-app-muted">{m.role}</div>
                          {cycleWindow ? (
                            <div className={paid ? "mt-0.5 text-[12px] font-semibold text-emerald-600" : "mt-0.5 text-[12px] font-semibold text-amber-600"}>
                              {paid ? "Paid" : "Unpaid"}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(members?.data ?? []).length > 10 ? (
                  <div className="text-[12px] text-app-muted">Showing 10 of {memberCount}.</div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-app-muted">
                Payments
              </div>
              <div className="mt-2 space-y-2">
                {(contributions?.data ?? []).map((c) => {
                  const name =
                    (c.profiles?.first_name ?? "Member") +
                    (c.profiles?.last_name ? ` ${c.profiles.last_name}` : "");
                  const status =
                    c.status === "paid"
                      ? "Paid"
                      : c.status === "pending"
                        ? "Pending"
                        : c.status === "failed"
                          ? "Failed"
                          : c.status;
                  return (
                    <div key={c.id} className="rounded-2xl border border-app-border bg-white px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-app-fg">{name}</div>
                          <div className="mt-0.5 text-[12px] text-app-muted">
                            {new Date(c.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-semibold text-app-fg">
                            {formatMoney(Number(c.amount ?? 0), c.currency ?? selectedGroup.currency ?? "NGN")}
                          </div>
                          <div className="mt-0.5 text-[12px] font-semibold text-app-muted">{status}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(contributions?.data ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-app-border bg-white px-4 py-4 text-center text-[13px] text-app-muted">
                    No payments yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
