"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";

type Member = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  position: number;
};

type PayoutManagerProps = {
  groupId: string;
  groupName: string;
  currency: string;
  contributionAmount: number;
  members: Member[];
  currentCycle: number;
};

export default function PayoutManager({
  groupId,
  groupName,
  currency,
  contributionAmount,
  members,
  currentCycle,
}: PayoutManagerProps) {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [amount, setAmount] = useState<string>(contributionAmount.toString());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/group-payout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_id: groupId,
          cycle_number: currentCycle,
          recipient_user_id: selectedMember,
          amount: parseFloat(amount),
          currency,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Failed to initiate payout");
      }

      setSuccess("Payout initiated successfully!");
      // Reset form
      setSelectedMember("");
      setAmount(contributionAmount.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  const orderedMembers = [...members].sort((a, b) => a.position - b.position);
  const nextRecipient = orderedMembers.length > 0 ? orderedMembers[(currentCycle - 1) % orderedMembers.length] : null;

  return (
    <Card className="px-5 py-5">
      <div className="text-[14px] font-semibold text-app-fg">Initiate Payout</div>
      <div className="mt-1 text-[12px] text-app-muted">
        Manually initiate a payout for cycle #{currentCycle}
      </div>

      {nextRecipient && (
        <div className="mt-3 rounded-2xl bg-blue-50 p-3">
          <div className="text-[12px] font-semibold text-blue-800">Next in line</div>
          <div className="mt-1 text-[13px] font-semibold text-blue-900">
            {nextRecipient.first_name} {nextRecipient.last_name}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-[12px] font-semibold text-app-muted">Recipient</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="mt-1 w-full rounded-xl border border-app-border bg-white px-3 py-2 text-[13px]"
            required
            disabled={busy}
          >
            <option value="">Select a member</option>
            {orderedMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.first_name} {member.last_name} (#{member.position})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-app-muted">Amount</label>
          <div className="relative mt-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-app-border bg-white px-3 py-2 pr-12 text-[13px]"
              min="0"
              step="0.01"
              required
              disabled={busy}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[12px] text-app-muted">
              {currency}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={busy || !selectedMember || !amount}
          >
            {busy ? "Initiating..." : "Initiate Payout"}
          </Button>
        </div>
      </form>
    </Card>
  );
}