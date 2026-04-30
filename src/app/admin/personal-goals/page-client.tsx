"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Divider } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import PersonalGoalPayoutStatusUpdater from "./payout-status-updater";

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
  personal_goals: { title: string } | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export default function PersonalGoalsPayoutsPageClient({
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
  };

  return (
    <div className="space-y-5">
      <Card className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold text-app-fg">Personal Goals Payouts</div>
            <div className="mt-1 text-[12px] text-app-muted">Manage personal savings payouts</div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-app-bg text-app-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Goal</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Initiated</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const goalName = p.personal_goals?.title ?? "Unknown Goal";
                const userName =
                  (p.profiles?.first_name ?? "User") +
                  (p.profiles?.last_name ? ` ${p.profiles.last_name}` : "");
                const userEmail = p.profiles?.email ?? "—";
                const initiatedDate = new Date(p.initiated_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr key={p.id} className="border-t border-app-border">
                    <td className="px-5 py-3 font-semibold text-app-fg">
                      <div className="text-[13px]">{goalName}</div>
                      <div className="mt-0.5 text-[11px] text-app-muted">{p.goal_id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[13px] text-app-fg">{userName}</div>
                      <div className="mt-0.5 text-[11px] text-app-muted">{userEmail}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-app-fg">
                      {formatMoney(Number(p.amount), p.currency ?? "NGN")}
                    </td>
                    <td className="px-5 py-3">
                      <PersonalGoalPayoutStatusUpdater
                        payoutId={p.id}
                        currentStatus={p.status}
                        onStatusUpdate={handleStatusUpdate}
                      />
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
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-app-muted">
                    No payouts found.
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