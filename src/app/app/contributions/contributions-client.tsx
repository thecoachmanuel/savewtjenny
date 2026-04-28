"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button, Card, Chip, Input } from "@/components/ui";
import { formatMoney } from "@/lib/money";

type GroupItem = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
  total_cycles: number;
  members: number;
  paid_cycles: number;
};

type GoalItem = {
  id: string;
  title: string;
  currency: string;
  target_amount: number;
  saved_amount: number;
};

type Tab = "all" | "groups" | "goals";

export function ContributionsClient({ groups, goals }: { groups: GroupItem[]; goals: GoalItem[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, q]);

  const filteredGoals = useMemo(() => {
    if (!q) return goals;
    return goals.filter((g) => g.title.toLowerCase().includes(q));
  }, [goals, q]);

  const showGroups = tab === "all" || tab === "groups";
  const showGoals = tab === "all" || tab === "goals";

  const isEmpty =
    (showGroups ? filteredGroups.length === 0 : true) && (showGoals ? filteredGoals.length === 0 : true);

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
          <Input
            className="pl-11"
            placeholder="Search groups or goals"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search contributions"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active={tab === "all"} onClick={() => setTab("all")} type="button">
          All
        </Chip>
        <Chip active={tab === "groups"} onClick={() => setTab("groups")} type="button">
          Groups
        </Chip>
        <Chip active={tab === "goals"} onClick={() => setTab("goals")} type="button">
          Personal goals
        </Chip>
      </div>

      <div className="mt-4 space-y-3 pb-10">
        {showGroups && filteredGroups.length > 0 ? (
          <>
            {tab === "all" ? (
              <div className="px-1 text-[12px] font-semibold uppercase tracking-wide text-app-muted">
                Groups
              </div>
            ) : null}
            {filteredGroups.map((g) => {
              const totalCycles = Number(g.total_cycles ?? 0);
              const paid = Math.min(Number(g.paid_cycles ?? 0), totalCycles);
              const progress = totalCycles > 0 ? Math.round((paid / totalCycles) * 100) : 0;
              const nextAmount = formatMoney(Number(g.contribution_amount ?? 0), g.currency ?? "NGN");

              return (
                <Card key={g.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-app-fg">{g.name}</div>
                      <div className="mt-1 text-[12px] text-app-muted">
                        {g.members ? `${g.members} members` : "New group"}
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
                    <Link href={`/app/contribute?purpose=group_contribution&group_id=${encodeURIComponent(g.id)}`}>
                      <Button className="h-9 px-4 text-[13px]">Contribute</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </>
        ) : null}

        {showGoals && filteredGoals.length > 0 ? (
          <>
            {tab === "all" ? (
              <div className="mt-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-app-muted">
                Personal goals
              </div>
            ) : null}
            {filteredGoals.map((goal) => {
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
          </>
        ) : null}

        {isEmpty ? (
          <div className="rounded-3xl border border-app-border bg-white px-5 py-6 text-center text-[13px] text-app-muted">
            {q ? `No results for “${query.trim()}”.` : "No contributions yet. Join a group or create a personal goal to start saving."}
          </div>
        ) : null}
      </div>
    </div>
  );
}

