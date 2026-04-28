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

      if (userId && purpose === "personal_savings" && goalId) {
        const amount = tx.amount / 100;
        const rpc = await admin.rpc("apply_personal_savings_payment", {
          p_user_id: userId,
          p_goal_id: goalId,
          p_amount: amount,
          p_currency: tx.currency,
          p_reference: tx.reference,
        });

        if (rpc.error) {
          const existing = await admin
            .from("contributions")
            .select("id")
            .eq("paystack_reference", tx.reference)
            .limit(1)
            .maybeSingle<{ id: string }>();

          if (!existing.data) {
            const goal = await admin
              .from("personal_goals")
              .select("id,user_id,saved_amount,target_amount,status,currency")
              .eq("id", goalId)
              .eq("user_id", userId)
              .maybeSingle<{
                id: string;
                user_id: string;
                saved_amount: number;
                target_amount: number;
                status: string;
                currency: string;
              }>();

            if (goal.data) {
              await admin.from("contributions").insert({
                user_id: userId,
                personal_goal_id: goalId,
                amount,
                currency: tx.currency ?? goal.data.currency ?? "NGN",
                status: "paid",
                paystack_reference: tx.reference,
              });

              const saved = Number(goal.data.saved_amount ?? 0) + amount;
              const target = Number(goal.data.target_amount ?? 0);
              await admin
                .from("personal_goals")
                .update({
                  saved_amount: saved,
                  status: target > 0 && saved >= target ? "completed" : goal.data.status ?? "active",
                })
                .eq("id", goalId)
                .eq("user_id", userId);
            }
          }
        }
      } else if (userId && purpose === "group_contribution") {
        const existing = await admin
          .from("contributions")
          .select("id")
          .eq("paystack_reference", tx.reference)
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (!existing.data) {
          await admin.from("contributions").insert({
            user_id: userId,
            group_id: groupId,
            amount: tx.amount / 100,
            currency: tx.currency,
            status: "paid",
            paystack_reference: tx.reference,
          });
        }
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
