import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContributionsClient } from "@/app/app/contributions/contributions-client";

export default async function ContributionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const groupsResult = await supabase
    .from("group_members")
    .select("group_id, groups:groups(id,name,currency,contribution_amount,total_cycles)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .returns<
      Array<{
        group_id: string;
        groups: {
          id: string;
          name: string;
          currency: string;
          contribution_amount: number;
          total_cycles: number;
        } | null;
      }>
    >();

  const groups = (groupsResult.data ?? []).flatMap((r) => (r.groups ? [r.groups] : []));
  const groupIds = groups.map((g) => g.id);

  const membersResult =
    groupIds.length > 0
      ? await supabase.from("group_members").select("group_id").in("group_id", groupIds)
      : { data: [] as Array<{ group_id: string }> | null };

  const memberCounts = new Map<string, number>();
  for (const row of membersResult.data ?? []) {
    memberCounts.set(row.group_id, (memberCounts.get(row.group_id) ?? 0) + 1);
  }

  const paidResult =
    groupIds.length > 0
      ? await supabase
          .from("contributions")
          .select("group_id")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .in("group_id", groupIds)
      : { data: [] as Array<{ group_id: string | null }> | null };

  const paidCounts = new Map<string, number>();
  for (const row of paidResult.data ?? []) {
    if (!row.group_id) continue;
    paidCounts.set(row.group_id, (paidCounts.get(row.group_id) ?? 0) + 1);
  }

  const goalsResult = await supabase
    .from("personal_goals")
    .select("id,title,currency,target_amount,saved_amount")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<
      Array<{
        id: string;
        title: string;
        currency: string;
        target_amount: number;
        saved_amount: number;
      }>
    >();

  const goals = goalsResult.data ?? [];

  const mappedGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    currency: g.currency ?? "NGN",
    contribution_amount: Number(g.contribution_amount ?? 0),
    total_cycles: Number(g.total_cycles ?? 0),
    members: memberCounts.get(g.id) ?? 0,
    paid_cycles: Math.min(paidCounts.get(g.id) ?? 0, Number(g.total_cycles ?? 0)),
  }));

  const mappedGoals = goals.map((g) => ({
    id: g.id,
    title: g.title,
    currency: g.currency ?? "NGN",
    target_amount: Number(g.target_amount ?? 0),
    saved_amount: Number(g.saved_amount ?? 0),
  }));

  return <ContributionsClient groups={mappedGroups} goals={mappedGoals} />;
}
