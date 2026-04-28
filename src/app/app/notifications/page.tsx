import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button, Card } from "@/components/ui";

export default async function NotificationsPage() {
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
                Your contribution is due today for Summer Vacation.
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[12px] text-app-muted">Today</div>
                <Link href="/app/contribute">
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
                You’re next in line to receive the payout this cycle.
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

