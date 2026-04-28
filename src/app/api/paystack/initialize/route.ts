import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  purpose: z.enum(["group_contribution", "personal_savings"]),
  group_id: z.string().uuid().optional(),
  group_name: z.string().min(1).optional(),
  goal_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
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

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const amountKobo = Math.round(parsed.data.amount * 100);

  const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: parsed.data.email,
      amount: amountKobo,
      currency: "NGN",
      callback_url: `${origin}/app/receipt`,
      metadata: {
        user_id: data.user.id,
        purpose: parsed.data.purpose,
        group_id: parsed.data.group_id,
        group_name: parsed.data.group_name,
        goal_id: parsed.data.goal_id,
      },
    }),
  });

  const initJson = (await initResp.json().catch(() => null)) as
    | {
        status: boolean;
        message: string;
        data?: { authorization_url: string; reference: string };
      }
    | null;

  if (!initResp.ok || !initJson?.status || !initJson.data) {
    return NextResponse.json(
      { ok: false, message: initJson?.message ?? "Paystack initialization failed." },
      { status: 400 },
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    await admin.from("paystack_transactions").insert({
      reference: initJson.data.reference,
      user_id: data.user.id,
      amount_kobo: amountKobo,
      currency: "NGN",
      status: "initialized",
      metadata: {
        purpose: parsed.data.purpose,
        group_id: parsed.data.group_id,
        group_name: parsed.data.group_name,
        goal_id: parsed.data.goal_id,
      },
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    authorization_url: initJson.data.authorization_url,
    reference: initJson.data.reference,
  });
}

