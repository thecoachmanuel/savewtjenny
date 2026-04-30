"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Payout = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  reference: string | null;
};

export function PayoutHistory({ goalId }: { goalId: string }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        
        const { data, error } = await supabase
          .from("personal_goals_payouts")
          .select("id, amount, currency, status, initiated_at, processed_at, failure_reason, reference")
          .eq("personal_goal_id", goalId)
          .order("initiated_at", { ascending: false });

        if (error) throw error;
        
        setPayouts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payout history");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [goalId]);

  if (loading) {
    return (
      <Card className="mt-5 px-5 py-4">
        <div className="text-[13px] font-semibold text-app-fg">Payout History</div>
        <div className="mt-3 text-[12px] text-app-muted">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-5 px-5 py-4">
        <div className="text-[13px] font-semibold text-app-fg">Payout History</div>
        <div className="mt-3 text-[12px] text-red-600">{error}</div>
      </Card>
    );
  }

  if (payouts.length === 0) {
    return null;
  }

  return (
    <Card className="mt-5 px-5 py-4">
      <div className="text-[13px] font-semibold text-app-fg">Payout History</div>
      
      <div className="mt-3 space-y-3">
        {payouts.map((payout) => {
          const initiatedDate = new Date(payout.initiated_at).toLocaleString("en-NG", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          
          const processedDate = payout.processed_at 
            ? new Date(payout.processed_at).toLocaleString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;
          
          let statusText = payout.status;
          let statusClass = "text-app-muted";
          
          switch (payout.status) {
            case "pending":
              statusText = "Pending";
              statusClass = "text-amber-600";
              break;
            case "processing":
              statusText = "Processing";
              statusClass = "text-blue-600";
              break;
            case "completed":
              statusText = "Completed";
              statusClass = "text-emerald-600";
              break;
            case "failed":
              statusText = "Failed";
              statusClass = "text-red-600";
              break;
          }

          return (
            <div key={payout.id} className="rounded-2xl border border-app-border bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-app-fg">
                    {formatMoney(Number(payout.amount ?? 0), payout.currency ?? "NGN")}
                  </div>
                  <div className="mt-0.5 text-[12px] text-app-muted">
                    {payout.reference ?? "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[12px] font-semibold ${statusClass}`}>{statusText}</div>
                  <div className="mt-0.5 text-[11px] text-app-muted">{initiatedDate}</div>
                </div>
              </div>
              
              {payout.failure_reason && (
                <div className="mt-2 text-[11px] text-red-600">
                  Reason: {payout.failure_reason}
                </div>
              )}
              
              {processedDate && (
                <div className="mt-1 text-[11px] text-app-muted">
                  Processed: {processedDate}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}