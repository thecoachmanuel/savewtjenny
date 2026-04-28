import { Card, Divider } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [usersCount, groupsCount, txCount] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("paystack_transactions").select("reference", { count: "exact", head: true }),
  ]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <Card className="px-5 py-5">
        <div className="text-[14px] font-semibold text-app-fg">Finance overview</div>
        <div className="mt-1 text-[12px] text-app-muted">
          Connect payouts, cycles, and contribution automation as the next phase.
        </div>
        <Divider className="my-4" />
        <div className="grid gap-3 text-[13px] text-app-fg md:grid-cols-2">
          <div className="rounded-2xl border border-app-border bg-white px-4 py-4">
            <div className="text-[12px] text-app-muted">Group contributions (30d)</div>
            <div className="mt-2 text-[20px] font-semibold">₦0.00</div>
          </div>
          <div className="rounded-2xl border border-app-border bg-white px-4 py-4">
            <div className="text-[12px] text-app-muted">Personal savings (30d)</div>
            <div className="mt-2 text-[20px] font-semibold">₦0.00</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

