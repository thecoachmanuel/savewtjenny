import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  reference: z.string().min(1),
});

type PaystackVerifyResponse =
  | {
      status: true;
      message: string;
      data: {
        id: number;
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at: string | null;
        channel: string | null;
        customer: { email: string };
        metadata?: Record<string, unknown> | null;
      };
    }
  | { status: false; message: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ reference: url.searchParams.get("reference") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Missing reference." }, { status: 400 });
  }

  let serverEnv: ReturnType<typeof getServerEnv>;
  try {
    serverEnv = getServerEnv();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Server is missing Paystack configuration." },
      { status: 500 },
    );
  }

  const verifyResp = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(parsed.data.reference)}`,
    {
      headers: {
        Authorization: `Bearer ${serverEnv.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const json = (await verifyResp.json().catch(() => null)) as PaystackVerifyResponse | null;
  if (!verifyResp.ok || !json || !json.status) {
    return NextResponse.json(
      { ok: false, message: json?.message ?? "Could not verify transaction." },
      { status: 400 },
    );
  }

  const tx = json.data;
  const normalizedStatus = tx.status === "success" ? "success" : tx.status;

  try {
    const admin = createSupabaseAdminClient();

    await admin
      .from("paystack_transactions")
      .upsert(
        {
          reference: tx.reference,
          amount_kobo: tx.amount,
          currency: tx.currency,
          status: normalizedStatus,
          paid_at: tx.paid_at,
          channel: tx.channel,
          metadata: tx.metadata ?? null,
        },
        { onConflict: "reference" },
      );

    if (normalizedStatus === "success") {
      const meta = (tx.metadata ?? {}) as Record<string, unknown>;
      const userId = typeof meta.user_id === "string" ? meta.user_id : null;
      const purpose = typeof meta.purpose === "string" ? meta.purpose : null;
      const groupId = typeof meta.group_id === "string" ? meta.group_id : null;
      const goalId = typeof meta.goal_id === "string" ? meta.goal_id : null;

      if (userId && (purpose === "group_contribution" || purpose === "personal_savings")) {
        await admin.from("contributions").insert({
          user_id: userId,
          group_id: groupId,
          personal_goal_id: goalId,
          amount: tx.amount / 100,
          currency: tx.currency,
          status: "paid",
          paystack_reference: tx.reference,
        });
      }
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    reference: tx.reference,
    status: normalizedStatus,
    amount: tx.amount / 100,
    currency: tx.currency,
    paid_at: tx.paid_at,
    email: tx.customer?.email ?? null,
    metadata: tx.metadata ?? null,
  });
}

