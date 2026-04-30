import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  group_id: z.string().uuid(),
  cycle_number: z.number().int().positive(),
  recipient_user_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().min(1),
});

export async function POST(request: Request) {
  // Validate admin access
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const profile = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle<{ role: string }>();

  if (!profile.data || profile.data.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  // Parse and validate request body
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request data" }, { status: 400 });
  }

  const { group_id, cycle_number, recipient_user_id, amount, currency } = parsed.data;

  // Verify group exists and is active
  const group = await admin
    .from("groups")
    .select("id, name, status")
    .eq("id", group_id)
    .maybeSingle<{ id: string; name: string; status: string }>();

  if (!group.data || group.data.status !== "active") {
    return NextResponse.json({ ok: false, message: "Invalid or inactive group" }, { status: 400 });
  }

  // Verify recipient is a group member
  const member = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", group_id)
    .eq("user_id", recipient_user_id)
    .maybeSingle<{ user_id: string }>();

  if (!member.data) {
    return NextResponse.json({ ok: false, message: "Recipient is not a group member" }, { status: 400 });
  }

  // Check if payout already exists for this cycle
  const existingPayout = await admin
    .from("group_payouts")
    .select("id")
    .eq("group_id", group_id)
    .eq("cycle_number", cycle_number)
    .maybeSingle<{ id: string }>();

  if (existingPayout.data) {
    return NextResponse.json({ ok: false, message: "Payout already initiated for this cycle" }, { status: 400 });
  }

  // Create the payout record
  const { data, error } = await admin
    .from("group_payouts")
    .insert({
      group_id,
      cycle_number,
      recipient_user_id,
      amount,
      currency,
      status: "pending",
      initiated_by: userData.user.id,
    })
    .select()
    .single<{
      id: string;
      group_id: string;
      cycle_number: number;
      recipient_user_id: string;
      amount: number;
      currency: string;
      status: string;
      initiated_by: string;
      initiated_at: string;
    }>();

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to initiate payout" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payout: data });
}