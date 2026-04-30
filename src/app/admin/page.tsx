import { Card, Divider } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminControls from "./admin-controls";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [usersCount, groupsCount, txCount, payoutsCount] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("paystack_transactions").select("reference", { count: "exact", head: true }),
    supabase.from("group_payouts").select("id", { count: "exact", head: true }),
  ]);

  // Get recent payout statistics
  const { data: payoutStats } = await supabase
    .from("group_payouts")
    .select("status, amount")
    .limit(100);

  const totalPayouts = payoutsCount.count ?? 0;
  const completedPayouts = payoutStats?.filter(p => p.status === "completed").length ?? 0;
  const pendingPayouts = payoutStats?.filter(p => p.status === "pending").length ?? 0;
  const totalPayoutAmount = payoutStats?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="px-5 py-5">
          <div className="text-[12px] font-semibold text-app-muted">Total Users</div>
          <div className="mt-2 text-[26px] font-semibold text-app-fg">
            {usersCount.count ?? 0}
          </div>
        </Card>
        <Card className="px-5 py-5">
          <div className="text-[12px] font-semibold text-app-muted">Total Groups</div>
          <div className="mt-2 text-[26px] font-semibold text-app-fg">
            {groupsCount.count ?? 0}
          </div>
        </Card>
        <Card className="px-5 py-5">
          <div className="text-[12px] font-semibold text-app-muted">Transactions</div>
          <div className="mt-2 text-[26px] font-semibold text-app-fg">
            {txCount.count ?? 0}
          </div>
        </Card>
        <Card className="px-5 py-5">
          <div className="text-[12px] font-semibold text-app-muted">Payouts</div>
          <div className="mt-2 text-[26px] font-semibold text-app-fg">
            {totalPayouts}
          </div>
        </Card>
      </div>

      <Card className="px-5 py-5">
        <div className="text-[14px] font-semibold text-app-fg">Finance overview</div>
        <div className="mt-1 text-[12px] text-app-muted">
          Payout and contribution statistics
        </div>
        <Divider className="my-4" />
        <div className="grid gap-3 text-[13px] text-app-fg md:grid-cols-2">
          <div className="rounded-2xl border border-app-border bg-white px-4 py-4">
            <div className="text-[12px] text-app-muted">Total Payouts</div>
            <div className="mt-2 text-[20px] font-semibold">₦{totalPayoutAmount.toLocaleString()}</div>
            <div className="mt-1 text-[11px] text-app-muted">
              {completedPayouts} completed · {pendingPayouts} pending
            </div>
          </div>
          <div className="rounded-2xl border border-app-border bg-white px-4 py-4">
            <div className="text-[12px] text-app-muted">Payout Completion Rate</div>
            <div className="mt-2 text-[20px] font-semibold">
              {totalPayouts > 0 ? Math.round((completedPayouts / totalPayouts) * 100) : 0}%
            </div>
            <div className="mt-1 text-[11px] text-app-muted">
              {completedPayouts} of {totalPayouts} payouts completed
            </div>
          </div>
        </div>
      </Card>
      
      <AdminControls />
    </div>
  );
}

