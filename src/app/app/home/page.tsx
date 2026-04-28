import Link from "next/link";
import { Bell, ChevronDown, Eye, Plus } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Group = {
  id: string;
  name: string;
};

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  let firstName = "there";
  let activeGroup: Group | null = null;

  const profileResult = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileResult.error && profileResult.data?.first_name) {
    firstName = profileResult.data.first_name;
  }

  const groupsResult = await supabase
    .from("groups")
    .select("id,name")
    .limit(1);

  if (!groupsResult.error && groupsResult.data?.[0]) {
    activeGroup = groupsResult.data[0] as Group;
  }

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
            $250
            <span className="text-[16px] text-app-muted">.00</span>
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
                5th
              </div>
              <div>
                <div className="text-[13px] font-semibold text-app-fg">
                  Next contribution in 1 week
                </div>
                <div className="mt-0.5 text-[12px] text-app-muted">
                  2 of 6 cycles completed.
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 rotate-[-90deg] text-app-muted" />
          </div>
        </div>

        <Button className="mt-4 w-full" variant="outline">
          Send contribution
        </Button>
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
                    Announcements
                  </div>
                  <div className="mt-0.5 text-[12px] text-app-muted">
                    6 members
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-app-muted">12:45 PM</div>
            </div>
          </Card>

          <Card className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-app-bg" />
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-semibold text-app-fg">
                      David Mensah
                    </div>
                    <div className="rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-semibold text-app-primary">
                      Admin
                    </div>
                  </div>
                  <div className="mt-0.5 text-[12px] text-app-muted">
                    You are the next in line to receive the...
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-app-muted">12:45 PM</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

