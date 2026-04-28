import { HomeTabs } from "@/app/app/home/home-tabs";
import { formatKobo, formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Group = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
  total_cycles: number;
};

type MessageRow = {
  id: string;
  message: string;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

type ActivityItem = {
  id: string;
  ts: string;
  title: string;
  subtitle: string;
  amount: string | null;
  status: string | null;
};

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  let firstName = "there";
  let activeGroup: Group | null = null;
  let paidCycles = 0;
  let recentMessages: MessageRow[] = [];
  let activity: ActivityItem[] = [];

  const profileResult = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileResult.error && profileResult.data?.first_name) {
    firstName = profileResult.data.first_name;
  }

  const groupsResult = await supabase
    .from("group_members")
    .select("group_id, groups:groups(id,name,currency,contribution_amount,total_cycles)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle<{
      group_id: string;
      groups: Group | null;
    }>();

  if (!groupsResult.error && groupsResult.data?.groups) {
    activeGroup = groupsResult.data.groups;

    const paidCyclesResult = await supabase
      .from("contributions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("group_id", activeGroup.id)
      .eq("status", "paid");
    paidCycles = paidCyclesResult.count ?? 0;

    const messagesResult = await supabase
      .from("group_messages")
      .select("id,message,created_at,profiles:profiles(first_name,last_name)")
      .eq("group_id", activeGroup.id)
      .order("created_at", { ascending: false })
      .limit(2)
      .returns<MessageRow[]>();
    recentMessages = messagesResult.data ?? [];
  }

  const contributionAmount = activeGroup ? Number(activeGroup.contribution_amount) : 0;
  const contributionCurrency = activeGroup?.currency ?? "NGN";
  const formattedContribution = formatMoney(contributionAmount, contributionCurrency);

  const userContribs = await supabase
    .from("contributions")
    .select(
      "id,amount,currency,status,created_at,group_id,personal_goal_id,groups:groups(name),personal_goals:personal_goals(title)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<
      Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
        group_id: string | null;
        personal_goal_id: string | null;
        groups: { name: string } | null;
        personal_goals: { title: string } | null;
      }>
    >();

  const userTx = await supabase
    .from("paystack_transactions")
    .select("reference,amount_kobo,currency,status,paid_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<
      Array<{
        reference: string;
        amount_kobo: number | null;
        currency: string | null;
        status: string | null;
        paid_at: string | null;
        created_at: string;
      }>
    >();

  const items: ActivityItem[] = [];

  for (const c of userContribs.data ?? []) {
    const title = c.group_id
      ? `Contribution · ${c.groups?.name ?? "Group"}`
      : c.personal_goal_id
        ? `Personal savings · ${c.personal_goals?.title ?? "Goal"}`
        : "Contribution";
    items.push({
      id: `contribution:${c.id}`,
      ts: c.created_at,
      title,
      subtitle: c.status,
      amount: formatMoney(Number(c.amount ?? 0), c.currency ?? "NGN"),
      status: c.status,
    });
  }

  for (const t of userTx.data ?? []) {
    items.push({
      id: `paystack:${t.reference}`,
      ts: t.paid_at ?? t.created_at,
      title: "Payment · Paystack",
      subtitle: t.reference,
      amount: formatKobo(t.amount_kobo, t.currency ?? "NGN"),
      status: t.status ?? "pending",
    });
  }

  if (activeGroup) {
    for (const m of recentMessages) {
      const name =
        (m.profiles?.first_name ?? "Member") +
        (m.profiles?.last_name ? ` ${m.profiles.last_name}` : "");
      items.push({
        id: `message:${m.id}`,
        ts: m.created_at,
        title: `Message · ${activeGroup.name}`,
        subtitle: `${name}: ${m.message}`,
        amount: null,
        status: null,
      });
    }
  }

  activity = items
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 12);

  return (
    <HomeTabs
      firstName={firstName}
      activeGroup={activeGroup}
      formattedContribution={formattedContribution}
      paidCycles={paidCycles}
      recentMessages={recentMessages}
      activity={activity}
    />
  );
}
