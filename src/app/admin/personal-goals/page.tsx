import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PersonalGoalsPayoutsPageClient from "./page-client";

type PayoutRow = {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_by: string | null;
  initiated_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  reference: string | null;
  personal_goals: { title: string } | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export default async function AdminPersonalGoalsPayoutsPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch payouts
  const { data: payouts } = await supabase
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
      personal_goals:personal_goals(title),
      profiles:profiles(first_name,last_name,email)
    `)
    .order("initiated_at", { ascending: false })
    .limit(50)
    .returns<PayoutRow[]>();

  return <PersonalGoalsPayoutsPageClient initialPayouts={payouts ?? []} />;
}