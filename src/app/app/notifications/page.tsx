import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button, Card } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function dueLabel(dueAt: Date) {
  const now = new Date();
  const startA = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startB = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());
  const diffDays = Math.round((startB.getTime() - startA.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  return `In ${diffDays} days`;
}

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const groupResult = await supabase
    .from("group_members")
    .select("group_id, joined_at, groups:groups(id,name,cycle_frequency,currency,contribution_amount)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(10)
    .returns<
      Array<{
        group_id: string;
        joined_at: string;
        groups: {
          id: string;
          name: string;
          cycle_frequency: string;
          currency: string;
          contribution_amount: number;
        } | null;
      }>
    >();

  const memberships = groupResult.data ?? [];
  const groups = memberships.flatMap((m) => (m.groups ? [m.groups] : []));
  const groupIds = groups.map((g) => g.id);
  const activeGroup = groups[0] ?? null;

  const paidRows =
    groupIds.length > 0
      ? await supabase
          .from("contributions")
          .select("group_id")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .in("group_id", groupIds)
          .returns<Array<{ group_id: string | null }>>()
      : { data: [] as Array<{ group_id: string | null }> };

  const paidCounts = new Map<string, number>();
  for (const row of paidRows.data ?? []) {
    if (!row.group_id) continue;
    paidCounts.set(row.group_id, (paidCounts.get(row.group_id) ?? 0) + 1);
  }

  const dueReminders = memberships
    .flatMap((m) => {
      if (!m.groups) return [];
      const paid = paidCounts.get(m.groups.id) ?? 0;
      const dueAt = addFrequency(new Date(m.joined_at), m.groups.cycle_frequency, paid);
      return [
        {
          group_id: m.groups.id,
          group_name: m.groups.name,
          dueAt,
          label: dueLabel(dueAt),
        },
      ];
    })
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, 3);

  let positionText: string | null = null;
  if (activeGroup) {
    const members = await supabase
      .from("group_members")
      .select("user_id,position,joined_at")
      .eq("group_id", activeGroup.id)
      .order("position", { ascending: true })
      .order("joined_at", { ascending: true })
      .returns<Array<{ user_id: string; position: number; joined_at: string }>>();

    const list = members.data ?? [];
    const me = list.find((m) => m.user_id === user.id) ?? null;
    if (me) {
      positionText = `You are #${me.position} of ${list.length} in the rotation.`;
    }
  }

  const goalsResult = await supabase
    .from("personal_goals")
    .select("id,title,target_amount,saved_amount,currency")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3)
    .returns<
      Array<{ id: string; title: string; target_amount: number; saved_amount: number; currency: string }>
    >();

  const goals = (goalsResult.data ?? []).filter((g) => Number(g.saved_amount) < Number(g.target_amount));

  return (
    <div>
      <AppHeader title="Notifications" backHref="/app/home" />

      <div className="px-5 pt-5">
        {dueReminders.map((r) => (
          <Card key={r.group_id} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg">
                <BellRing className="h-5 w-5 text-app-primary" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-app-fg">Contribution reminder</div>
                <div className="mt-1 text-[12px] text-app-muted">
                  Your contribution is due for {r.group_name}.
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[12px] text-app-muted">{r.label}</div>
                  <Link
                    href={`/app/contribute?purpose=group_contribution&group_id=${encodeURIComponent(r.group_id)}`}
                  >
                    <Button className="h-9 px-4 text-[13px]">Send contribution</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {dueReminders.length === 0 ? (
          <Card className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg">
                <BellRing className="h-5 w-5 text-app-primary" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-app-fg">Contribution reminder</div>
                <div className="mt-1 text-[12px] text-app-muted">
                  Join a group to start saving and receive reminders.
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[12px] text-app-muted">—</div>
                  <Link href="/app/groups">
                    <Button className="h-9 px-4 text-[13px]">Browse groups</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="mt-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">
                Payout notification
              </div>
              <div className="mt-1 text-[12px] text-app-muted">
                {positionText ?? "Your rotation position will appear once you join a group."}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-app-muted" />
          </div>
          <div className="mt-3 text-[12px] text-app-muted">2 days ago</div>
        </Card>

        {goals.map((g) => (
          <Card key={g.id} className="mt-3 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-app-fg">Savings reminder</div>
                <div className="mt-1 text-[12px] text-app-muted">
                  Add money to {g.title} to stay on track.
                </div>
              </div>
              <Link href={`/app/contribute?purpose=personal_savings&goal_id=${encodeURIComponent(g.id)}`}>
                <Button variant="outline" className="h-9 px-4 text-[13px]">
                  Add money
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
