"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import PayoutStatusUpdater from "./payout-status-updater";

type PayoutRow = {
  id: string;
  group_id: string;
  cycle_number: number;
  recipient_user_id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  reference: string | null;
  groups: { id: string; name: string } | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export default function AdminPayoutsPage({
  initialPayouts,
}: {
  initialPayouts: PayoutRow[];
}) {
  const [payouts, setPayouts] = useState<PayoutRow[]>(initialPayouts);
  const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);

  const handleStatusUpdate = (payoutId: string, newStatus: string) => {
    setPayouts(prev => 
      prev.map(p => 
        p.id === payoutId ? { ...p, status: newStatus } : p
      )
    );
    setEditingPayoutId(null);
  };

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
      <Card className="overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-[14px] font-semibold text-app-fg">Payouts</div>
          <div className="mt-1 text-[12px] text-app-muted">Manage group payouts</div>
        </div>

        {/* Payouts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-app-bg text-app-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Group</th>
                <th className="px-5 py-3 font-semibold">Cycle</th>
                <th className="px-5 py-3 font-semibold">Recipient</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Initiated</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const groupName = p.groups?.name ?? "Unknown Group";
                const recipientName =
                  (p.profiles?.first_name ?? "User") + (p.profiles?.last_name ? ` ${p.profiles.last_name}` : "");
                const amount = formatMoney(Number(p.amount), p.currency ?? "NGN");
                const initiatedDate = new Date(p.initiated_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr key={p.id} className="border-t border-app-border">
                    <td className="px-5 py-3 font-semibold text-app-fg">
                      <Link href={`/admin/groups?group_id=${p.group_id}`} className="hover:text-app-primary">
                        {groupName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-app-fg">#{p.cycle_number}</td>
                    <td className="px-5 py-3 text-app-fg">{recipientName}</td>
                    <td className="px-5 py-3 font-semibold text-app-fg">{amount}</td>
                    <td className="px-5 py-3">
                      {editingPayoutId === p.id ? (
                        <PayoutStatusUpdater 
                          payoutId={p.id} 
                          currentStatus={p.status} 
                          onStatusUpdate={handleStatusUpdate} 
                        />
                      ) : (
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-app-fg">{initiatedDate}</td>
                    <td className="px-5 py-3">
                      {editingPayoutId === p.id ? (
                        <button 
                          onClick={() => setEditingPayoutId(null)}
                          className="text-[12px] font-semibold text-app-primary"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button 
                          onClick={() => setEditingPayoutId(p.id)}
                          className="text-[12px] font-semibold text-app-primary"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[13px] text-app-muted">
                    No payouts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button className="rounded-xl border border-app-border bg-white px-4 py-2 text-[13px] font-semibold text-app-fg">
          Export CSV
        </button>
        <button className="rounded-xl bg-app-primary px-4 py-2 text-[13px] font-semibold text-white">
          Initiate Payout
        </button>
      </div>
    </div>
  );
}