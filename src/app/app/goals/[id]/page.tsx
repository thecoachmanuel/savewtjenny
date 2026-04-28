import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button, Card, Divider } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  currency: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  status: string;
  created_at: string;
};

type ContributionRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paystack_reference: string | null;
};

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  const goalResult = await supabase
    .from("personal_goals")
    .select("id,title,description,currency,target_amount,saved_amount,target_date,status,created_at")
    .eq("id", params.id)
    .maybeSingle<GoalRow>();

  if (!goalResult.data) notFound();
  const goal = goalResult.data;

  const tx = await supabase
    .from("contributions")
    .select("id,amount,currency,status,created_at,paystack_reference")
    .eq("personal_goal_id", goal.id)
    .order("created_at", { ascending: false })
    .limit(15)
    .returns<ContributionRow[]>();

  const saved = Number(goal.saved_amount ?? 0);
  const target = Number(goal.target_amount ?? 0);
  const remaining = Math.max(target - saved, 0);
  const progress = target > 0 ? Math.round((Math.min(saved, target) / target) * 100) : 0;
  const status = goal.status === "completed" ? "Completed" : "Active";

  return (
    <div>
      <AppHeader title="Personal Goal" backHref="/app/contributions" />

      <div className="px-5 pt-5 pb-10">
        <Card className="px-5 py-4">
          <div className="text-[15px] font-semibold text-app-fg">{goal.title}</div>
          {goal.description ? (
            <div className="mt-1 text-[12px] text-app-muted">{goal.description}</div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
              <div className="text-app-muted">Saved</div>
              <div className="mt-1 font-semibold text-app-fg">{formatMoney(saved, goal.currency ?? "NGN")}</div>
            </div>
            <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
              <div className="text-app-muted">Target</div>
              <div className="mt-1 font-semibold text-app-fg">
                {formatMoney(target, goal.currency ?? "NGN")}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
              <div className="text-app-muted">Remaining</div>
              <div className="mt-1 font-semibold text-app-fg">
                {formatMoney(remaining, goal.currency ?? "NGN")}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
              <div className="text-app-muted">Status</div>
              <div className="mt-1 font-semibold text-app-fg">{status}</div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-app-bg">
            <div className="h-full rounded-full bg-app-primary" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px] text-app-muted">
            <div>{progress}%</div>
            {goal.target_date ? (
              <div>
                Target date{" "}
                {new Date(goal.target_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            ) : (
              <div>—</div>
            )}
          </div>

          <Divider className="my-4" />

          <Link href={`/app/contribute?purpose=personal_savings&goal_id=${encodeURIComponent(goal.id)}`}>
            <Button className="w-full">{goal.status === "completed" ? "Add more money" : "Add money"}</Button>
          </Link>
        </Card>

        <div className="mt-5">
          <div className="text-[13px] font-semibold text-app-fg">Recent savings</div>
          <div className="mt-3 space-y-3">
            {(tx.data ?? []).map((c) => {
              const label = c.status === "paid" ? "Paid" : c.status;
              const when = new Date(c.created_at).toLocaleString("en-NG", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Card key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-app-fg">
                        {formatMoney(Number(c.amount ?? 0), c.currency ?? goal.currency ?? "NGN")}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-app-muted">
                        {c.paystack_reference ?? "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-semibold text-app-fg">{label}</div>
                      <div className="mt-0.5 text-[11px] text-app-muted">{when}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {(tx.data ?? []).length === 0 ? (
              <div className="rounded-3xl border border-app-border bg-white px-5 py-6 text-center text-[13px] text-app-muted">
                No savings yet. Add money to start building this goal.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
