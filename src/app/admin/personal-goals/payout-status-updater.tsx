"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export default function PersonalGoalPayoutStatusUpdater({
  payoutId,
  currentStatus,
  onStatusUpdate,
}: {
  payoutId: string;
  currentStatus: string;
  onStatusUpdate: (payoutId: string, newStatus: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [status, setStatus] = useState<PayoutStatus>(currentStatus as PayoutStatus);

  const handleUpdateStatus = async () => {
    setBusy(true);
    setError(null);

    try {
      const updateData: {
        payout_id: string;
        status: string;
      } = {
        payout_id: payoutId,
        status,
      };

      const response = await fetch("/api/admin/personal-goals-payout/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Failed to update payout status");
      }

      onStatusUpdate(payoutId, status);
      setEditingStatus(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  const statusOptions: { value: PayoutStatus; label: string; className: string }[] = [
    { value: "pending", label: "Pending", className: "text-amber-600" },
    { value: "processing", label: "Processing", className: "text-blue-600" },
    { value: "completed", label: "Completed", className: "text-emerald-600" },
    { value: "failed", label: "Failed", className: "text-red-600" },
  ];

  const currentOption = statusOptions.find((opt) => opt.value === currentStatus) || statusOptions[0];

  if (editingStatus) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PayoutStatus)}
          className="rounded-lg border border-app-border bg-white px-2 py-1 text-[12px]"
          disabled={busy}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          onClick={handleUpdateStatus}
          disabled={busy}
          className="h-7 px-2 text-[12px]"
          variant="primary"
        >
          {busy ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={() => {
            setEditingStatus(false);
            setStatus(currentStatus as PayoutStatus);
          }}
          disabled={busy}
          className="h-7 px-2 text-[12px]"
          variant="outline"
        >
          Cancel
        </Button>
        {error && <div className="text-[11px] text-red-600">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`text-[12px] font-semibold ${currentOption.className}`}>
        {currentOption.label}
      </div>
      <Button
        onClick={() => setEditingStatus(true)}
        className="h-7 px-2 text-[12px]"
        variant="outline"
      >
        Edit
      </Button>
    </div>
  );
}