import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

  // Get query parameters
  const url = new URL(request.url);
  const groupId = url.searchParams.get("group_id");
  const status = url.searchParams.get("status");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  // Build query
  let query = admin
    .from("group_payouts")
    .select(`
      id,
      group_id,
      cycle_number,
      recipient_user_id,
      amount,
      currency,
      status,
      initiated_by,
      initiated_at,
      processed_at,
      failure_reason,
      reference,
      groups (id, name),
      profiles (id, first_name, last_name, email)
    `)
    .order("initiated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to fetch payouts" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payouts: data });
}