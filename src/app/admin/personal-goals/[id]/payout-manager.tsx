"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";

type GoalRow = {
  id: string;
  title: string;
  currency: string;
  target_amount: number;
  saved_amount: number;
  status: string;
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

export default function PersonalGoalPayoutManager({
  goal,
  payouts,
  onPayoutInitiated,
  userId,
}: {
  goal: GoalRow;
  payouts: PayoutRow[];
  onPayoutInitiated: (payout: PayoutRow) => void;
  userId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInitiatePayout = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const payoutData = {
        goal_id: goal.id,
        user_id: userId,
        amount: Number(goal.saved_amount),
        currency: goal.currency,
      };

      const response = await fetch("/api/admin/personal-goals-payout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payoutData),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Failed to initiate payout");
      }

      setSuccess("Payout initiated successfully!");
      onPayoutInitiated(result.payout[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  const pendingPayout = payouts.find(p => p.status === "pending");
  const canInitiatePayout = Number(goal.saved_amount) > 0 && !pendingPayout;

  return (
    <Card className="px-5 py-4">
      <div className="text-[14px] font-semibold text-app-fg">Payout Management</div>
      <div className="mt-1 text-[12px] text-app-muted">
        Manually initiate a payout for this personal goal
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
          <div className="text-app-muted">Available Balance</div>
          <div className="mt-1 font-semibold text-app-fg">
            {formatMoney(Number(goal.saved_amount), goal.currency ?? "NGN")}
          </div>
        </div>
        <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
          <div className="text-app-muted">Target Amount</div>
          <div className="mt-1 font-semibold text-app-fg">
            {formatMoney(Number(goal.target_amount), goal.currency ?? "NGN")}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={handleInitiatePayout}
          disabled={busy || !canInitiatePayout}
          className="w-full"
          variant="primary"
        >
          {busy ? "Initiating..." : "Initiate Payout"}
        </Button>
        
        {!canInitiatePayout && (
          <div className="mt-2 text-center text-[12px] text-app-muted">
            {pendingPayout 
              ? "A payout is already pending for this goal" 
              : "No available balance to payout"}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
          {success}
        </div>
      )}
    </Card>
  );
}