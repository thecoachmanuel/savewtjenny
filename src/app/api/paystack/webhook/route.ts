import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let serverEnv: ReturnType<typeof getServerEnv>;
  try {
    serverEnv = getServerEnv();
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const secret = serverEnv.PAYSTACK_SECRET_KEY;

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
      paid_at?: string | null;
      channel?: string | null;
      metadata?: Record<string, unknown> | null;
    };
  };

  const ref = event.data?.reference;
  if (!ref) return NextResponse.json({ ok: true });

  try {
    const admin = createSupabaseAdminClient();
    await admin
      .from("paystack_transactions")
      .upsert(
        {
          reference: ref,
          amount_kobo: event.data?.amount ?? null,
          currency: event.data?.currency ?? null,
          status: event.data?.status ?? null,
          paid_at: event.data?.paid_at ?? null,
          channel: event.data?.channel ?? null,
          metadata: event.data?.metadata ?? null,
        },
        { onConflict: "reference" },
      );
  } catch {}

  return NextResponse.json({ ok: true });
}
