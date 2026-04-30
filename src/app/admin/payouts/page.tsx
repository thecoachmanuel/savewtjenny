import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminPayoutsPageClient from "./page-client";

type PayoutRow = {
  id: string;
  group_id: string;
  cycle_number: number;
  recipient_user_id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  reference: string | null;
  groups: { id: string; name: string } | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export default async function AdminPayoutsPageWrapper() {
  const supabase = await createSupabaseServerClient();

  // Fetch payouts
  const { data: payouts } = await supabase
    .from("group_payouts")
    .select(`
      id,
      group_id,
      cycle_number,
      recipient_user_id,
      amount,
      currency,
      status,
      initiated_at,
      processed_at,
      failure_reason,
      reference,
      groups (id, name),
      profiles (first_name, last_name, email)
    `)
    .order("initiated_at", { ascending: false })
    .limit(50)
    .returns<PayoutRow[]>();

  return <AdminPayoutsPageClient initialPayouts={payouts ?? []} />;
}