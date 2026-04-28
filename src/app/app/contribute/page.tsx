"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronLeft, ShieldCheck } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type InitResponse =
  | { ok: true; authorization_url: string; reference: string }
  | { ok: false; message: string };

export default function ContributePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [amount, setAmount] = useState("250");
  const [groupName] = useState("Summer Vacation");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onContinue() {
    setError(null);
    setLoading(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) {
      setLoading(false);
      setError("Please sign in again.");
      return;
    }

    const resp = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: data.user.email,
        amount: Number(amount),
        purpose: "group_contribution",
        group_name: groupName,
      }),
    });

    const json = (await resp.json()) as InitResponse;
    setLoading(false);

    if (!json.ok) {
      setError(json.message);
      return;
    }

    window.location.assign(json.authorization_url);
  }

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-app-fg" />
        </button>
        <div className="text-[15px] font-semibold text-app-fg">Send Contribution</div>
        <div className="h-10 w-10" />
      </div>

      <Card className="mt-5 px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Group
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-app-border bg-white px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold text-app-fg">{groupName}</div>
            <div className="mt-0.5 text-[12px] text-app-muted">6 members</div>
          </div>
          <ChevronDown className="h-4 w-4 text-app-muted" />
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Recipient
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-app-border bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-app-bg" />
            <div>
              <div className="text-[13px] font-semibold text-app-fg">Jerome Bell</div>
              <div className="mt-0.5 text-[12px] text-app-muted">Next in line</div>
            </div>
          </div>
          <div className="rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-semibold text-app-primary">
            1st in line
          </div>
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Contribution
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-app-border bg-white px-4 py-3">
          <div className="text-[14px] font-semibold text-app-fg">₦</div>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="h-10 border-0 bg-transparent px-0 text-[18px] font-semibold focus:ring-0"
            aria-label="Amount"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Due today</div>
              <div className="mt-0.5 text-amber-800">
                Your contribution is due today. Pay now to stay on track.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <Button className="w-full" onClick={onContinue} disabled={loading}>
          {loading ? "Opening Paystack..." : "Continue"}
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-app-muted">
        <ShieldCheck className="h-4 w-4 text-app-primary" />
        Secure payment powered by Paystack
      </div>
    </div>
  );
}

