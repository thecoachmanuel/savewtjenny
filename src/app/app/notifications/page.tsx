import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button, Card } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const groupResult = await supabase
    .from("group_members")
    .select("group_id, groups:groups(id,name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ group_id: string; groups: { id: string; name: string } | null }>();

  const activeGroup = groupResult.data?.groups ?? null;

  let positionText: string | null = null;
  if (activeGroup) {
    const members = await supabase
      .from("group_members")
      .select("user_id,position,joined_at")
      .eq("group_id", activeGroup.id)
      .order("position", { ascending: true })
      .order("joined_at", { ascending: true })
      .returns<Array<{ user_id: string; position: number; joined_at: string }>>();

    const list = members.data ?? [];
    const idx = list.findIndex((m) => m.user_id === user.id);
    if (idx >= 0) {
      positionText = `You are ${idx + 1} of ${list.length} in the rotation.`;
    }
  }

  return (
    <div>
      <AppHeader title="Notifications" backHref="/app/home" />

      <div className="px-5 pt-5">
        <Card className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg">
              <BellRing className="h-5 w-5 text-app-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-app-fg">
                Contribution reminder
              </div>
              <div className="mt-1 text-[12px] text-app-muted">
                {activeGroup
                  ? `Your contribution is due for ${activeGroup.name}.`
                  : "Your contribution is due. Join a group to start saving."}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[12px] text-app-muted">Today</div>
                <Link
                  href={
                    activeGroup
                      ? `/app/contribute?purpose=group_contribution&group_id=${encodeURIComponent(activeGroup.id)}`
                      : "/app/groups"
                  }
                >
                  <Button className="h-9 px-4 text-[13px]">Send contribution</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">
                Payout notification
              </div>
              <div className="mt-1 text-[12px] text-app-muted">
                {positionText ?? "Your rotation position will appear once you join a group."}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-app-muted" />
          </div>
          <div className="mt-3 text-[12px] text-app-muted">2 days ago</div>
        </Card>
      </div>
    </div>
  );
}
