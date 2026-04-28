import Link from "next/link";
import { Bell, ChevronDown, Eye, Plus } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
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

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  let firstName = "there";
  let activeGroup: Group | null = null;
  let paidCycles = 0;
  let recentMessages: MessageRow[] = [];

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

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]" />
          <div className="min-w-0">
            <div className="text-[12px] text-app-muted">Hello, {firstName} 👋</div>
            <div className="mt-0.5 text-[14px] font-semibold text-app-fg">
              {activeGroup?.name ?? "Choose a group"}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-app-muted" />
        </div>

        <Link
          href="/app/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-app-fg" />
        </Link>
      </div>

      <Card className="mt-5 px-5 py-4">
        <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Your contribution
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="text-[36px] font-semibold tracking-tight text-app-fg">
            {formattedContribution}
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-app-bg"
            aria-label="Toggle visibility"
          >
            <Eye className="h-4 w-4 text-app-muted" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-app-border bg-app-bg px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-white text-[12px] font-semibold text-app-fg">
                {Math.min(paidCycles + 1, activeGroup?.total_cycles ?? 1)}x
              </div>
              <div>
                <div className="text-[13px] font-semibold text-app-fg">
                  Next contribution
                </div>
                <div className="mt-0.5 text-[12px] text-app-muted">
                  {Math.min(paidCycles, activeGroup?.total_cycles ?? 0)} of {activeGroup?.total_cycles ?? 0} cycles completed.
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 rotate-[-90deg] text-app-muted" />
          </div>
        </div>

        {activeGroup ? (
          <Link
            href={`/app/contribute?purpose=group_contribution&group_id=${encodeURIComponent(activeGroup.id)}`}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-app-border bg-white px-4 text-[14px] font-medium text-app-fg transition-colors hover:bg-app-bg active:bg-app-bg"
          >
            Send contribution
          </Link>
        ) : (
          <Button className="mt-4 w-full" variant="outline" disabled>
            Send contribution
          </Button>
        )}
      </Card>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="border-b-2 border-app-primary pb-2 text-[13px] font-semibold text-app-fg">
              Chat
            </div>
            <div className="pb-2 text-[13px] font-semibold text-app-muted">
              Activity
            </div>
          </div>
          <Link
            href="/app/groups"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            aria-label="New group"
          >
            <Plus className="h-4 w-4 text-app-fg" />
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          <Card className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-app-bg" />
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">
                    {activeGroup?.name ?? "No group yet"}
                  </div>
                  <div className="mt-0.5 text-[12px] text-app-muted">
                    {recentMessages[0]?.message
                      ? recentMessages[0].message
                      : activeGroup
                        ? "No messages yet."
                        : "Join a group to start chatting."}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-app-muted">
                {recentMessages[0]?.created_at
                  ? new Date(recentMessages[0].created_at).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </div>
            </div>
          </Card>

          {recentMessages[1] ? (
            <Card className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-app-bg" />
                  <div>
                    <div className="text-[13px] font-semibold text-app-fg">
                      {(recentMessages[1].profiles?.first_name ?? "Member") +
                        (recentMessages[1].profiles?.last_name
                          ? ` ${recentMessages[1].profiles.last_name}`
                          : "")}
                    </div>
                    <div className="mt-0.5 text-[12px] text-app-muted">
                      {recentMessages[1].message}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-app-muted">
                  {new Date(recentMessages[1].created_at).toLocaleTimeString("en-NG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
