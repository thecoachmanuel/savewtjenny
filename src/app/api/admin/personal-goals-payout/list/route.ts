import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  goal_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
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

    const { goal_id, user_id, status, limit, offset } = parsed.data;

    // Build query
    let query = admin
      .from("personal_goals_payouts")
      .select(`
        id,
        goal_id,
        user_id,
        amount,
        currency,
        status,
        initiated_by,
        initiated_at,
        processed_at,
        failure_reason,
        reference,
        personal_goals:title,
        profiles:first_name,last_name,email
      `)
      .range(offset, offset + limit - 1)
      .order("initiated_at", { ascending: false });

    if (goal_id) {
      query = query.eq("goal_id", goal_id);
    }

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, message: "Failed to fetch payouts" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payouts: data });
  } catch (err) {
    console.error("Error listing personal goal payouts:", err);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}