"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Divider } from "@/components/ui";

type VerifyResponse =
  | {
      ok: true;
      reference: string;
      status: string;
      amount: number;
      currency: string;
      paid_at: string | null;
      email: string | null;
      metadata: Record<string, unknown> | null;
    }
  | { ok: false; message: string };

export default function ReceiptPage() {
  const params = useSearchParams();
  const reference = params.get("reference");

  const [state, setState] = useState<{
    loading: boolean;
    data: VerifyResponse | null;
  }>({ loading: true, data: null });

  const formattedAmount = useMemo(() => {
    if (!state.data || state.data.ok !== true) return "";
    const currency = state.data.currency === "NGN" ? "₦" : state.data.currency;
    return `${currency}${Number(state.data.amount).toFixed(2)}`;
  }, [state.data]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!reference) {
        setState({ loading: false, data: { ok: false, message: "Missing reference." } });
        return;
      }

      setState({ loading: true, data: null });
      const resp = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, {
        cache: "no-store",
      });
      const json = (await resp.json()) as VerifyResponse;
      if (!cancelled) setState({ loading: false, data: json });
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const ok = state.data?.ok === true && state.data.status === "success";

  function onDownload() {
    if (!state.data || state.data.ok !== true) return;
    const lines = [
      "Save with Jenny Receipt",
      `Status: ${state.data.status}`,
      `Amount: ${formattedAmount}`,
      `Reference: ${state.data.reference}`,
      `Paid at: ${state.data.paid_at ?? "-"}`,
      `Email: ${state.data.email ?? "-"}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${state.data.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onShare() {
    if (!state.data || state.data.ok !== true) return;
    const text = `Save with Jenny receipt\nAmount: ${formattedAmount}\nReference: ${state.data.reference}\nStatus: ${state.data.status}`;
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex flex-1 items-stretch justify-center px-4 py-6">
      <div className="w-full max-w-[420px]">
        <Card className="px-5 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="mt-3 text-[14px] font-semibold text-app-fg">
              {state.loading ? "Processing..." : ok ? "Successful" : "Pending"}
            </div>
            <div className="mt-2 text-[28px] font-semibold tracking-tight text-app-fg">
              {state.loading ? "—" : ok ? formattedAmount : "—"}
            </div>
            <div className="mt-1 text-[12px] text-app-muted">
              {state.data && state.data.ok === true && state.data.paid_at
                ? new Date(state.data.paid_at).toLocaleString()
                : " "}
            </div>
          </div>

          <Divider className="my-5" />

          {state.data?.ok === false ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {state.data.message}
            </div>
          ) : null}

          {state.data?.ok === true ? (
            <div className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <div className="text-app-muted">Reference</div>
                <div className="font-semibold text-app-fg">{state.data.reference}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-app-muted">Status</div>
                <div className="font-semibold text-app-fg">{state.data.status}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-app-muted">Payment method</div>
                <div className="font-semibold text-app-fg">Paystack</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-app-muted">Reference note</div>
                <div className="font-semibold text-app-fg">Cycle 1 contribution</div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={onDownload} disabled={!ok}>
              Download
            </Button>
            <Button className="w-full" variant="outline" onClick={() => void onShare()} disabled={!ok}>
              Share
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

