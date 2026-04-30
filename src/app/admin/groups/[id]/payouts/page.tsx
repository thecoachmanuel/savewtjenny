import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PayoutManager from "./payout-manager";

type GroupRow = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
  cycle_frequency: string;
  total_cycles: number;
  created_at: string;
};

type PayoutRow = {
  id: string;
  cycle_number: number;
  recipient_user_id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  reference: string | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

type Member = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  position: number;
};

export default async function AdminGroupPayoutsPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  
  // Fetch group details
  const { data: group } = await supabase
    .from("groups")
    .select("id,name,currency,contribution_amount,cycle_frequency,total_cycles,created_at")
    .eq("id", params.id)
    .maybeSingle<GroupRow>();

  if (!group) {
    notFound();
  }

  // Calculate current cycle
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

  const cycleWindow = getCycleWindow(new Date(group.created_at), group.cycle_frequency);
  const currentCycle = Math.min(cycleWindow.idx + 1, group.total_cycles);

  // Fetch group payouts
  const { data: payouts } = await supabase
    .from("group_payouts")
    .select(`
      id,
      cycle_number,
      recipient_user_id,
      amount,
      currency,
      status,
      initiated_at,
      processed_at,
      failure_reason,
      reference,
      profiles:profiles(first_name,last_name,email)
    `)
    .eq("group_id", params.id)
    .order("cycle_number", { ascending: false })
    .returns<PayoutRow[]>();

  // Fetch group members for payout manager
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id,profiles:first_name,profiles:last_name,position")
    .eq("group_id", params.id)
    .order("position", { ascending: true })
    .returns<Member[]>();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/groups" className="text-[13px] font-semibold text-app-primary">
          ← Back to groups
        </Link>
        <div className="mt-1 text-[18px] font-semibold text-app-fg">{group.name}</div>
        <div className="text-[13px] text-app-muted">
          {formatMoney(Number(group.contribution_amount), group.currency ?? "NGN")} · {group.cycle_frequency} ·{" "}
          {group.total_cycles} cycles
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-[14px] font-semibold text-app-fg">Payout History</div>
          <div className="mt-1 text-[12px] text-app-muted">
            All payout records for this group
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-app-bg text-app-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Cycle</th>
                <th className="px-5 py-3 font-semibold">Recipient</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Initiated</th>
                <th className="px-5 py-3 font-semibold">Processed</th>
              </tr>
            </thead>
            <tbody>
              {(payouts ?? []).map((p) => {
                const recipientName =
                  (p.profiles?.first_name ?? "User") + (p.profiles?.last_name ? ` ${p.profiles.last_name}` : "");
                const amount = formatMoney(Number(p.amount), p.currency ?? "NGN");
                const initiatedDate = new Date(p.initiated_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const processedDate = p.processed_at
                  ? new Date(p.processed_at).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "-";

                return (
                  <tr key={p.id} className="border-t border-app-border">
                    <td className="px-5 py-3 font-semibold text-app-fg">#{p.cycle_number}</td>
                    <td className="px-5 py-3 text-app-fg">{recipientName}</td>
                    <td className="px-5 py-3 font-semibold text-app-fg">{amount}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-app-fg">{initiatedDate}</td>
                    <td className="px-5 py-3 text-app-fg">{processedDate}</td>
                  </tr>
                );
              })}
              {(payouts ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-app-muted">
                    No payouts found for this group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PayoutManager
        groupId={group.id}
        groupName={group.name}
        currency={group.currency}
        contributionAmount={group.contribution_amount}
        members={members ?? []}
        currentCycle={currentCycle}
      />
    </div>
  );
}