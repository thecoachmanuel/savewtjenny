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

type CycleManagerProps = {
  groupId: string;
  groupName: string;
  currency: string;
  contributionAmount: number;
  totalCycles: number;
  cycleFrequency: string;
  members: Member[];
  currentCycle: number;
  onCycleUpdate: (newCycle: number) => void;
};

export default function CycleManager({
  groupId,
  groupName,
  currency,
  contributionAmount,
  totalCycles,
  cycleFrequency,
  members,
  currentCycle,
  onCycleUpdate,
}: CycleManagerProps) {
  const [newCycle, setNewCycle] = useState(currentCycle.toString());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const cycleNumber = parseInt(newCycle);
      if (isNaN(cycleNumber) || cycleNumber < 1 || cycleNumber > totalCycles) {
        throw new Error(`Cycle number must be between 1 and ${totalCycles}`);
      }

      // In a real implementation, this would call an API to update the cycle
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCycleUpdate(cycleNumber);
      setSuccess("Cycle updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  const orderedMembers = [...members].sort((a, b) => a.position - b.position);
  const currentRecipient = orderedMembers.length > 0 ? orderedMembers[(currentCycle - 1) % orderedMembers.length] : null;

  return (
    <Card className="px-5 py-5">
      <div className="text-[14px] font-semibold text-app-fg">Cycle Management</div>
      <div className="mt-1 text-[12px] text-app-muted">
        Manage group cycles and payout positions
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-[12px] font-semibold text-app-muted">Current Cycle</div>
          <div className="mt-1 text-[16px] font-semibold text-app-fg">#{currentCycle} of {totalCycles}</div>
        </div>
        
        <div>
          <div className="text-[12px] font-semibold text-app-muted">Frequency</div>
          <div className="mt-1 text-[16px] font-semibold text-app-fg">{cycleFrequency}</div>
        </div>
      </div>

      {currentRecipient && (
        <div className="mt-4 rounded-2xl bg-blue-50 p-3">
          <div className="text-[12px] font-semibold text-blue-800">Current Recipient</div>
          <div className="mt-1 text-[13px] font-semibold text-blue-900">
            {currentRecipient.first_name} {currentRecipient.last_name}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-[12px] font-semibold text-app-muted">Update Cycle Number</label>
          <div className="relative mt-1">
            <input
              type="number"
              value={newCycle}
              onChange={(e) => setNewCycle(e.target.value)}
              className="w-full rounded-xl border border-app-border bg-white px-3 py-2 text-[13px]"
              min="1"
              max={totalCycles}
              required
              disabled={busy}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[12px] text-app-muted">
              of {totalCycles}
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
            disabled={busy}
          >
            {busy ? "Updating..." : "Update Cycle"}
          </Button>
        </div>
      </form>

      <div className="mt-4">
        <div className="text-[12px] font-semibold text-app-muted">Member Order</div>
        <div className="mt-2 space-y-2">
          {orderedMembers.map((member, index) => (
            <div 
              key={member.user_id} 
              className={`rounded-2xl border px-4 py-3 ${
                index === (currentCycle - 1) % orderedMembers.length 
                  ? "border-blue-200 bg-blue-50" 
                  : "border-app-border bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-app-fg">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-[12px] font-semibold text-app-muted">
                  #{member.position}
                </div>
              </div>
              {index === (currentCycle - 1) % orderedMembers.length && (
                <div className="mt-1 text-[11px] font-semibold text-blue-600">
                  Current recipient
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}