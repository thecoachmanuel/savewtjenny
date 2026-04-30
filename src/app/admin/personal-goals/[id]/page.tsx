import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Divider } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PersonalGoalPayoutManager from "./payout-manager";

type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  currency: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  status: string;
  created_at: string;
};

type PayoutRow = {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_by: string | null;
  initiated_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  reference: string | null;
};

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export default async function AdminPersonalGoalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  // Fetch goal details
  const goalResult = await supabase
    .from("personal_goals")
    .select("id,user_id,title,description,currency,target_amount,saved_amount,target_date,status,created_at")
    .eq("id", params.id)
    .maybeSingle<GoalRow>();

  if (!goalResult.data) notFound();
  const goal = goalResult.data;

  // Fetch user details
  const userResult = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email")
    .eq("id", goal.user_id)
    .maybeSingle<UserRow>();

  const user = userResult.data;

  // Fetch goal payouts
  const { data: payouts } = await supabase
    .from("personal_goals_payouts")
    .select(`
      id,
      goal_id,
      user_id,
      amount,
      currency,
      status,
      initiated_by,
      initiated_at,
      processed_at,
      failure_reason,
      reference
    `)
    .eq("goal_id", goal.id)
    .order("initiated_at", { ascending: false })
    .limit(20)
    .returns<PayoutRow[]>();

  const userName =
    (user?.first_name ?? "User") +
    (user?.last_name ? ` ${user.last_name}` : "");
  const userEmail = user?.email ?? "—";

  return (
    <div className="space-y-5">
      <Card className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold text-app-fg">Personal Goal</div>
            <div className="mt-1 text-[12px] text-app-muted">
              {userName} · {userEmail}
            </div>
          </div>
          <Link
            href="/admin/personal-goals"
            className="text-[13px] font-semibold text-app-primary"
          >
            ← Back to all payouts
          </Link>
        </div>
      </Card>

      <Card className="px-5 py-4">
        <div className="text-[15px] font-semibold text-app-fg">{goal.title}</div>
        {goal.description ? (
          <div className="mt-1 text-[12px] text-app-muted">{goal.description}</div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
          <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
            <div className="text-app-muted">Saved</div>
            <div className="mt-1 font-semibold text-app-fg">
              {formatMoney(Number(goal.saved_amount), goal.currency ?? "NGN")}
            </div>
          </div>
          <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
            <div className="text-app-muted">Target</div>
            <div className="mt-1 font-semibold text-app-fg">
              {formatMoney(Number(goal.target_amount), goal.currency ?? "NGN")}
            </div>
          </div>
          <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
            <div className="text-app-muted">Status</div>
            <div className="mt-1 font-semibold text-app-fg">
              {goal.status === "completed" ? "Completed" : "Active"}
            </div>
          </div>
          <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
            <div className="text-app-muted">Created</div>
            <div className="mt-1 font-semibold text-app-fg">
              {new Date(goal.created_at).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </Card>

      <PersonalGoalPayoutManager
        goal={goal}
        payouts={payouts ?? []}
        userId={goal.user_id}
        onPayoutInitiated={(newPayout) => {
          // In a real implementation, this would update the payouts list
          console.log("Payout initiated:", newPayout);
        }}
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-[14px] font-semibold text-app-fg">Payout History</div>
          <div className="mt-1 text-[12px] text-app-muted">
            All payout records for this personal goal
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-app-bg text-app-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Initiated</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {(payouts ?? []).map((p) => {
                const initiatedDate = new Date(p.initiated_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const status =
                  p.status === "completed"
                    ? "Completed"
                    : p.status === "failed"
                    ? "Failed"
                    : p.status === "processing"
                    ? "Processing"
                    : "Pending";

                const statusClass =
                  p.status === "completed"
                    ? "text-emerald-600"
                    : p.status === "failed"
                    ? "text-red-600"
                    : p.status === "processing"
                    ? "text-blue-600"
                    : "text-amber-600";

                return (
                  <tr key={p.id} className="border-t border-app-border">
                    <td className="px-5 py-3 font-semibold text-app-fg">
                      {formatMoney(Number(p.amount), p.currency ?? "NGN")}
                    </td>
                    <td className="px-5 py-3">
                      <div className={`text-[12px] font-semibold ${statusClass}`}>
                        {status}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-app-fg">
                      <div className="text-[12px]">{initiatedDate}</div>
                      <div className="mt-0.5 text-[11px] text-app-muted">
                        {new Date(p.initiated_at).toLocaleTimeString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-app-fg">
                      {p.reference ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {(payouts ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-app-muted">
                    No payouts found for this personal goal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}