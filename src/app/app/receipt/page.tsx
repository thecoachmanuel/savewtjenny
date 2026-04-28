"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Divider } from "@/components/ui";
import { formatMoney } from "@/lib/money";

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

  const [busy, setBusy] = useState(false);

  const formattedAmount = useMemo(() => {
    if (!state.data || state.data.ok !== true) return "";
    return formatMoney(Number(state.data.amount), state.data.currency ?? "NGN");
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
  const referenceNote = useMemo(() => {
    if (!state.data || state.data.ok !== true) return "-";
    const meta = (state.data.metadata ?? {}) as Record<string, unknown>;
    const groupName = typeof meta.group_name === "string" ? meta.group_name : null;
    const purpose = typeof meta.purpose === "string" ? meta.purpose : null;
    if (purpose === "personal_savings") return "Personal savings";
    if (groupName) return `Group contribution · ${groupName}`;
    return "Contribution";
  }, [state.data]);

  async function makeReceiptJpegBlob() {
    if (!state.data || state.data.ok !== true) return null;

    const payload = {
      appName: "Save with Jenny",
      status: state.data.status,
      amountText: formattedAmount,
      reference: state.data.reference,
      paidAtText: state.data.paid_at
        ? new Date(state.data.paid_at).toLocaleString("en-NG", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      email: state.data.email ?? "-",
      note: referenceNote,
    };

    const width = 1080;
    const height = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    const cardX = 80;
    const cardY = 120;
    const cardW = width - cardX * 2;
    const cardH = height - cardY * 2;
    const r = 48;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx.lineTo(cardX + cardW, cardY + cardH - r);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    ctx.lineTo(cardX + r, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    ctx.lineTo(cardX, cardY + r);
    ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(15, 23, 42, 0.14)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    ctx.fill();
    ctx.restore();

    const cx = width / 2;
    const iconY = cardY + 140;
    ctx.fillStyle = payload.status === "success" ? "#DCFCE7" : "#FEF3C7";
    ctx.beginPath();
    ctx.arc(cx, iconY, 64, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = payload.status === "success" ? "#16A34A" : "#D97706";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 26, iconY + 4);
    ctx.lineTo(cx - 6, iconY + 26);
    ctx.lineTo(cx + 34, iconY - 18);
    ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.textAlign = "center";
    ctx.font = "600 44px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(payload.status === "success" ? "Successful" : "Pending", cx, iconY + 122);

    ctx.font = "700 92px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(payload.status === "success" ? payload.amountText : "—", cx, iconY + 238);

    ctx.fillStyle = "#475569";
    ctx.font = "500 30px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(payload.appName, cx, iconY - 90);

    const left = cardX + 70;
    const top = iconY + 300;
    const rowGap = 76;
    const labelColor = "#64748B";
    const valueColor = "#0F172A";
    const dividerColor = "#E2E8F0";

    const rows: Array<{ label: string; value: string }> = [
      { label: "Reference", value: payload.reference },
      { label: "Status", value: payload.status },
      { label: "Payment method", value: "Paystack" },
      { label: "Reference note", value: payload.note },
      { label: "Paid at", value: payload.paidAtText },
      { label: "Email", value: payload.email },
    ];

    ctx.textAlign = "left";
    for (let i = 0; i < rows.length; i++) {
      const y = top + i * rowGap;
      ctx.fillStyle = labelColor;
      ctx.font = "600 28px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.fillText(rows[i].label, left, y);

      ctx.fillStyle = valueColor;
      ctx.textAlign = "right";
      ctx.font = "600 28px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.fillText(rows[i].value, cardX + cardW - 70, y);
      ctx.textAlign = "left";

      if (i !== rows.length - 1) {
        ctx.strokeStyle = dividerColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left, y + 32);
        ctx.lineTo(cardX + cardW - 70, y + 32);
        ctx.stroke();
      }
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    return blob;
  }

  async function onDownloadJpg() {
    if (!ok || busy) return;
    setBusy(true);
    try {
      const blob = await makeReceiptJpegBlob();
      if (!blob || !state.data || state.data.ok !== true) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${state.data.reference}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function onShareJpg() {
    if (!ok || busy) return;
    setBusy(true);
    try {
      const blob = await makeReceiptJpegBlob();
      if (!blob || !state.data || state.data.ok !== true) return;
      const file = new File([blob], `receipt-${state.data.reference}.jpg`, {
        type: "image/jpeg",
      });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        Boolean(navigator.share) &&
        Boolean((navigator as unknown as { canShare?: (d: unknown) => boolean }).canShare?.({ files: [file] }));

      if (canShareFiles) {
        await navigator.share({
          files: [file],
          title: "Save with Jenny Receipt",
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${state.data.reference}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
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
                <div className="font-semibold text-app-fg">{referenceNote}</div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={() => void onDownloadJpg()} disabled={!ok || busy}>
              {busy ? "Preparing..." : "Download JPG"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => void onShareJpg()}
              disabled={!ok || busy}
            >
              {busy ? "Preparing..." : "Share JPG"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
