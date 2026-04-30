"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";

type PayoutRequestProps = {
  goalId: string;
  goalTitle: string;
  savedAmount: number;
  currency: string;
  onSuccess: () => void;
};

export function RequestPayout({ goalId, goalTitle, savedAmount, currency, onSuccess }: PayoutRequestProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestPayout = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch("/api/personal-goals/request-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goalId }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Failed to request payout");
      }

      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="mt-5 px-5 py-4">
        <div className="text-center">
          <div className="text-[15px] font-semibold text-app-fg">Payout Requested!</div>
          <div className="mt-2 text-[13px] text-app-muted">
            Your payout request for {formatMoney(savedAmount, currency)} has been submitted successfully.
            Our team will process it shortly.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-5 px-5 py-4">
      <div className="text-[15px] font-semibold text-app-fg">Request Payout</div>
      <div className="mt-2 text-[13px] text-app-muted">
        Request a payout for your completed goal "{goalTitle}" worth {formatMoney(savedAmount, currency)}.
      </div>
      
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          className="w-full" 
          onClick={handleRequestPayout} 
          disabled={loading}
        >
          {loading ? "Processing..." : "Request Payout"}
        </Button>
      </div>
    </Card>
  );
}