import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card, Divider } from "@/components/ui";

export default async function SecurityPage() {
  return (
    <div>
      <AppHeader title="Security" backHref="/app/account" />

      <div className="px-5 pt-5 pb-8">
        <Card className="overflow-hidden">
          <Link href="/app/pin" className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">Account PIN</div>
              <div className="mt-0.5 text-[12px] text-app-muted">
                Set or change your PIN
              </div>
            </div>
          </Link>
          <Divider />
          <div className="px-5 py-4">
            <div className="text-[13px] font-semibold text-app-fg">Session</div>
            <div className="mt-0.5 text-[12px] text-app-muted">
              You can sign out from the Account tab.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

