import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  payout_id: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  reference: z.string().optional(),
  failure_reason: z.string().optional(),
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

  const { payout_id, status, reference, failure_reason } = parsed.data;

  // Verify payout exists
  const payout = await admin
    .from("group_payouts")
    .select("id, status")
    .eq("id", payout_id)
    .maybeSingle<{ id: string; status: string }>();

  if (!payout.data) {
    return NextResponse.json({ ok: false, message: "Payout not found" }, { status: 404 });
  }

  // Update the payout record
  const updateData: {
    status: string;
    processed_at?: string;
    reference?: string;
    failure_reason?: string;
  } = { status };

  // Set processed_at if status is completed or failed
  if (status === "completed" || status === "failed") {
    updateData.processed_at = new Date().toISOString();
  }

  if (reference) {
    updateData.reference = reference;
  }

  if (failure_reason) {
    updateData.failure_reason = failure_reason;
  }

  const { data, error } = await admin
    .from("group_payouts")
    .update(updateData)
    .eq("id", payout_id)
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
      processed_at: string | null;
      reference: string | null;
      failure_reason: string | null;
    }>();

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to update payout" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payout: data });
}