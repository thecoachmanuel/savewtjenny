import Image from "next/image";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, Chip, Divider } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  contribution_amount: number;
  cycle_frequency: string;
  total_cycles: number;
  cover_bucket: string | null;
  cover_path: string | null;
  invite_code: string;
};

type MemberRow = {
  user_id: string;
  role: string;
  position: number;
  joined_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createSupabaseServerClient();

  const groupResult = await supabase
    .from("groups")
    .select(
      "id,name,description,currency,contribution_amount,cycle_frequency,total_cycles,cover_bucket,cover_path,invite_code",
    )
    .eq("id", id)
    .maybeSingle<GroupRow>();

  if (!groupResult.data) notFound();
  const group = groupResult.data;

  const membersResult = await supabase
    .from("group_members")
    .select("user_id,role,position,joined_at,profiles:profiles(first_name,last_name,avatar_url)")
    .eq("group_id", id)
    .order("position", { ascending: true })
    .limit(25)
    .returns<MemberRow[]>();

  const members = (membersResult.data ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    position: m.position,
    joined_at: m.joined_at,
    profile: m.profiles,
  }));

  const latestMessage = await supabase
    .from("group_messages")
    .select("created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ created_at: string }>();

  const announcementTime = latestMessage.data?.created_at
    ? new Date(latestMessage.data.created_at).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const contributionDisplay = formatMoney(Number(group.contribution_amount), group.currency ?? "NGN");

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  const myMember = userId ? members.find((m) => m.user_id === userId) ?? null : null;

  const myPaidCyclesResult =
    userId
      ? await supabase
          .from("contributions")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id)
          .eq("user_id", userId)
          .eq("status", "paid")
      : null;
  const myPaidCycles = myPaidCyclesResult?.count ?? 0;

  const payoutEstimate = formatMoney(
    Number(group.contribution_amount) * Math.max(members.length, 1),
    group.currency ?? "NGN",
  );

  const hasCover = Boolean(group.cover_bucket && group.cover_path);

  return (
    <div>
      <AppHeader title={group.name} backHref="/app/home" />

      <div className="px-5 pt-5 pb-8">
        <div className="flex gap-2">
          <Chip active>Chat</Chip>
          <Chip>Info</Chip>
        </div>

        <div className="mt-4 space-y-3">
          <Card className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-app-fg">Announcements</div>
              <div className="text-[11px] text-app-muted">{announcementTime}</div>
            </div>
            <div className="mt-2 text-[12px] text-app-muted">
              {members.length} members
            </div>
          </Card>

          {members.slice(0, 5).map((m) => {
            const fullName =
              (m.profile?.first_name ?? "Member") +
              " " +
              (m.profile?.last_name ?? "");
            return (
              <Card key={m.user_id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {m.profile?.avatar_url ? (
                      <Image
                        src={m.profile.avatar_url}
                        alt={fullName}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-app-bg" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-semibold text-app-fg">
                          {fullName.trim()}
                        </div>
                        {m.role === "group_admin" ? (
                          <div className="rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-semibold text-app-primary">
                            Admin
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[12px] text-app-muted">
                        Position #{m.position}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-app-muted">
                    {new Date(m.joined_at).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-5 overflow-hidden">
          <div className="relative h-[132px] w-full bg-app-bg">
            {hasCover ? (
              <div className="absolute inset-0 bg-gradient-to-br from-app-primary/20 to-transparent" />
            ) : null}
          </div>
          <div className="px-5 py-4">
            <div className="text-[15px] font-semibold text-app-fg">{group.name}</div>
            <div className="mt-1 text-[12px] text-app-muted">
              {group.description ?? "Description"}
            </div>

            <Divider className="my-4" />

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Contribution</div>
                <div className="mt-1 font-semibold text-app-fg">{contributionDisplay}</div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Cycle Frequency</div>
                <div className="mt-1 font-semibold text-app-fg">
                  {group.cycle_frequency}
                </div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Members</div>
                <div className="mt-1 font-semibold text-app-fg">{members.length}</div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Cycles Completed</div>
                <div className="mt-1 font-semibold text-app-fg">
                  {Math.min(myPaidCycles, group.total_cycles)} of {group.total_cycles}
                </div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Position</div>
                <div className="mt-1 font-semibold text-app-fg">
                  {myMember ? `#${myMember.position}` : "-"}
                </div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Payout</div>
                <div className="mt-1 font-semibold text-app-fg">{payoutEstimate}</div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Deadline Date</div>
                <div className="mt-1 font-semibold text-app-fg">Every {group.cycle_frequency}</div>
              </div>
              <div className="rounded-2xl border border-app-border bg-white px-3 py-3">
                <div className="text-app-muted">Next Contribution</div>
                <div className="mt-1 font-semibold text-app-fg">{contributionDisplay}</div>
              </div>
            </div>

            <div className="mt-4 text-[12px] text-app-muted">
              Invite code: <span className="font-semibold text-app-fg">{group.invite_code}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
