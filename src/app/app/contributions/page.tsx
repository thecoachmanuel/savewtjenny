import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button, Card, Chip, Input } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ContributionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const groupsResult = await supabase
    .from("group_members")
    .select("group_id, groups:groups(id,name,currency,contribution_amount,total_cycles)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .returns<
      Array<{
        group_id: string;
        groups: {
          id: string;
          name: string;
          currency: string;
          contribution_amount: number;
          total_cycles: number;
        } | null;
      }>
    >();

  const groups = (groupsResult.data ?? []).flatMap((r) => (r.groups ? [r.groups] : []));
  const groupIds = groups.map((g) => g.id);

  const membersResult =
    groupIds.length > 0
      ? await supabase.from("group_members").select("group_id").in("group_id", groupIds)
      : { data: [] as Array<{ group_id: string }> | null };

  const memberCounts = new Map<string, number>();
  for (const row of membersResult.data ?? []) {
    memberCounts.set(row.group_id, (memberCounts.get(row.group_id) ?? 0) + 1);
  }

  const paidResult =
    groupIds.length > 0
      ? await supabase
          .from("contributions")
          .select("group_id")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .in("group_id", groupIds)
      : { data: [] as Array<{ group_id: string | null }> | null };

  const paidCounts = new Map<string, number>();
  for (const row of paidResult.data ?? []) {
    if (!row.group_id) continue;
    paidCounts.set(row.group_id, (paidCounts.get(row.group_id) ?? 0) + 1);
  }

  const goalsResult = await supabase
    .from("personal_goals")
    .select("id,title,currency,target_amount,saved_amount")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<
      Array<{
        id: string;
        title: string;
        currency: string;
        target_amount: number;
        saved_amount: number;
      }>
    >();

  const goals = goalsResult.data ?? [];

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-semibold text-app-fg">Contributions</div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/groups"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            aria-label="Groups"
          >
            <Users className="h-5 w-5 text-app-fg" />
          </Link>
          <Link
            href="/app/goals/create"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            aria-label="Create goal"
          >
            <Plus className="h-5 w-5 text-app-fg" />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-4 w-4 text-app-muted" />
          </div>
          <Input className="pl-11" placeholder="Search groups or goals" />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active>All</Chip>
        <Chip>Groups</Chip>
        <Chip>Personal goals</Chip>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((g) => {
          const members = memberCounts.get(g.id) ?? 0;
          const paid = Math.min(paidCounts.get(g.id) ?? 0, Number(g.total_cycles ?? 0));
          const totalCycles = Number(g.total_cycles ?? 0);
          const progress = totalCycles > 0 ? Math.round((paid / totalCycles) * 100) : 0;
          const nextAmount = formatMoney(Number(g.contribution_amount ?? 0), g.currency ?? "NGN");

          return (
            <Card key={g.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">{g.name}</div>
                  <div className="mt-1 text-[12px] text-app-muted">
                    {members ? `${members} members` : "New group"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-app-muted">Next</div>
                  <div className="text-[13px] font-semibold text-app-fg">{nextAmount}</div>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-app-bg">
                <div className="h-full rounded-full bg-app-primary" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[12px] text-app-muted">
                  {paid} of {totalCycles} cycles completed
                </div>
                <Link
                  href={`/app/contribute?purpose=group_contribution&group_id=${encodeURIComponent(g.id)}`}
                >
                  <Button className="h-9 px-4 text-[13px]">Contribute</Button>
                </Link>
              </div>
            </Card>
          );
        })}

        {goals.map((goal) => {
          const saved = Number(goal.saved_amount ?? 0);
          const target = Number(goal.target_amount ?? 0);
          const progress = target > 0 ? Math.round((Math.min(saved, target) / target) * 100) : 0;
          const remaining = Math.max(target - saved, 0);
          return (
            <Card key={goal.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">{goal.title}</div>
                  <div className="mt-1 text-[12px] text-app-muted">Personal goal</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-app-muted">Saved</div>
                  <div className="text-[13px] font-semibold text-app-fg">
                    {formatMoney(saved, goal.currency ?? "NGN")}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-app-bg">
                <div className="h-full rounded-full bg-app-primary" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[12px] text-app-muted">
                  {progress}% · Remaining {formatMoney(remaining, goal.currency ?? "NGN")}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/app/goals/${encodeURIComponent(goal.id)}`}>
                    <Button variant="outline" className="h-9 px-4 text-[13px]">
                      View
                    </Button>
                  </Link>
                  <Link href={`/app/contribute?purpose=personal_savings&goal_id=${encodeURIComponent(goal.id)}`}>
                    <Button className="h-9 px-4 text-[13px]">Add money</Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}

        {groups.length === 0 && goals.length === 0 ? (
          <div className="rounded-3xl border border-app-border bg-white px-5 py-6 text-center text-[13px] text-app-muted">
            No contributions yet. Join a group or create a personal goal to start saving.
          </div>
        ) : null}
      </div>
    </div>
  );
}
