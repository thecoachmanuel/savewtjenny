"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type PayoutStatusUpdaterProps = {
  payoutId: string;
  currentStatus: string;
  onStatusUpdate: (payoutId: string, newStatus: string) => void;
};

export default function PayoutStatusUpdater({
  payoutId,
  currentStatus,
  onStatusUpdate,
}: PayoutStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [reference, setReference] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const updateData: {
        payout_id: string;
        status: string;
        reference?: string;
        failure_reason?: string;
      } = {
        payout_id: payoutId,
        status,
      };

      if (reference) {
        updateData.reference = reference;
      }

      if (status === "failed" && failureReason) {
        updateData.failure_reason = failureReason;
      }

      const response = await fetch("/api/admin/group-payout/update", {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-[12px] font-semibold text-app-muted">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 w-full rounded-xl border border-app-border bg-white px-3 py-2 text-[13px]"
          disabled={busy}
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {(status === "completed" || status === "failed") && (
        <div>
          <label className="text-[12px] font-semibold text-app-muted">Reference</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="mt-1 w-full rounded-xl border border-app-border bg-white px-3 py-2 text-[13px]"
            placeholder="Transaction reference"
            disabled={busy}
          />
        </div>
      )}

      {status === "failed" && (
        <div>
          <label className="text-[12px] font-semibold text-app-muted">Failure Reason</label>
          <textarea
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-app-border bg-white px-3 py-2 text-[13px]"
            placeholder="Reason for failure"
            rows={2}
            disabled={busy}
          />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Updating..." : "Update Status"}
      </Button>
    </form>
  );
}