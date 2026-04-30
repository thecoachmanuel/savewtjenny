import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { goalId } = await request.json();

  // Get the authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  // Validate the goal exists and belongs to the user
  const { data: goal, error: goalError } = await supabase
    .from("personal_goals")
    .select("id, user_id, title, currency, target_amount, saved_amount, status")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (goalError || !goal) {
    return NextResponse.json({ ok: false, message: "Goal not found" }, { status: 404 });
  }

  // Check if goal is completed
  if (goal.status !== "completed") {
    return NextResponse.json({ ok: false, message: "Goal must be completed before requesting payout" }, { status: 400 });
  }

  // Check if there's already a payout request for this goal
  const { data: existingPayout } = await supabase
    .from("personal_goals_payouts")
    .select("id")
    .eq("personal_goal_id", goalId)
    .neq("status", "failed")
    .maybeSingle();

  if (existingPayout) {
    return NextResponse.json({ ok: false, message: "Payout already requested for this goal" }, { status: 400 });
  }

  // Create a payout request (initially pending)
  const { error: insertError } = await supabase
    .from("personal_goals_payouts")
    .insert({
      user_id: userId,
      personal_goal_id: goalId,
      amount: goal.saved_amount,
      currency: goal.currency,
      status: "pending",
      initiated_by: userId,
    });

  if (insertError) {
    return NextResponse.json({ ok: false, message: "Failed to request payout" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Payout request submitted successfully" });
}