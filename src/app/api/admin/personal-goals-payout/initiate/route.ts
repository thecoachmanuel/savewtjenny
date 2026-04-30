import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  goal_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const admin = await createSupabaseAdminClient();

    // Verify admin access
    const {
      data: { user },
    } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const profile = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile.data || profile.data.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Invalid request body" }, { status: 400 });
    }

    const { goal_id, user_id, amount, currency } = parsed.data;

    // Verify goal exists and belongs to user
    const goal = await admin
      .from("personal_goals")
      .select("id, user_id, title, saved_amount, currency")
      .eq("id", goal_id)
      .eq("user_id", user_id)
      .maybeSingle<{ id: string; user_id: string; title: string; saved_amount: number; currency: string }>();

    if (!goal.data) {
      return NextResponse.json({ ok: false, message: "Goal not found or does not belong to user" }, { status: 404 });
    }

    // Verify user has sufficient balance
    if (Number(goal.data.saved_amount) < amount) {
      return NextResponse.json({ ok: false, message: "Insufficient balance in goal" }, { status: 400 });
    }

    // Check if payout already exists for this goal
    const existingPayout = await admin
      .from("personal_goals_payouts")
      .select("id")
      .eq("goal_id", goal_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPayout.data) {
      return NextResponse.json({ ok: false, message: "Payout already initiated for this goal" }, { status: 400 });
    }

    // Create the payout record
    const { data, error } = await admin.from("personal_goals_payouts").insert({
      goal_id,
      user_id,
      amount,
      currency: currency ?? goal.data.currency,
      initiated_by: user.id,
      status: "pending"
    }).select();

    if (error) {
      return NextResponse.json({ ok: false, message: "Failed to initiate payout" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payout: data });
  } catch (err) {
    console.error("Error initiating personal goal payout:", err);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}