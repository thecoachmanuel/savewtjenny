"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function CreateGoalPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 1 && Number(targetAmount) > 0 && !loading;

  async function onCreate() {
    setError(null);
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError("Please sign in again.");
        return;
      }

      const insert = await supabase
        .from("personal_goals")
        .insert({
          user_id: auth.user.id,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          currency: "NGN",
          target_amount: Number(targetAmount),
          target_date: targetDate ? targetDate : null,
          status: "active",
        })
        .select("id")
        .maybeSingle<{ id: string }>();

      if (insert.error || !insert.data) {
        setError("Could not create goal. Please try again.");
        return;
      }

      router.replace(`/app/goals/${encodeURIComponent(insert.data.id)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-app-fg" />
        </button>
        <div className="text-[15px] font-semibold text-app-fg">Create Goal</div>
        <div className="h-10 w-10" />
      </div>

      <Card className="mt-5 px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">Goal name</div>
        <div className="mt-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rent, New phone" />
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">Target amount</div>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-app-border bg-white px-4 py-3">
          <div className="text-[14px] font-semibold text-app-fg">₦</div>
          <Input
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="h-10 border-0 bg-transparent px-0 text-[18px] font-semibold focus:ring-0"
            aria-label="Target amount"
            placeholder="0"
          />
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">Target date (optional)</div>
        <div className="mt-2">
          <Input value={targetDate} onChange={(e) => setTargetDate(e.target.value)} type="date" />
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">Description (optional)</div>
        <div className="mt-2">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note" />
        </div>
      </Card>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <Button className="w-full" onClick={onCreate} disabled={!canSubmit}>
          {loading ? "Creating..." : "Create goal"}
        </Button>
      </div>
    </div>
  );
}

