import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button, Card, Chip, Input } from "@/components/ui";

export default async function ContributionsPage() {
  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-semibold text-app-fg">Contributions</div>
        <Link
          href="/app/groups"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          aria-label="Groups"
        >
          <Plus className="h-5 w-5 text-app-fg" />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-4 w-4 text-app-muted" />
          </div>
          <Input className="pl-11" placeholder="Search groups or goals" />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active>All</Chip>
        <Chip>Groups</Chip>
        <Chip>Personal goals</Chip>
      </div>

      <div className="mt-4 space-y-3">
        <Card className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">
                Summer Vacation
              </div>
              <div className="mt-1 text-[12px] text-app-muted">6 members</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-app-muted">Next</div>
              <div className="text-[13px] font-semibold text-app-fg">$250.00</div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-app-bg">
            <div className="h-full w-[33%] rounded-full bg-app-primary" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[12px] text-app-muted">2 of 6 cycles completed</div>
            <Link href="/app/contribute">
              <Button className="h-9 px-4 text-[13px]">Contribute</Button>
            </Link>
          </div>
        </Card>

        <Card className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">
                New Phone Fund
              </div>
              <div className="mt-1 text-[12px] text-app-muted">
                Personal goal
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-app-muted">Saved</div>
              <div className="text-[13px] font-semibold text-app-fg">₦45,000</div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-app-bg">
            <div className="h-full w-[58%] rounded-full bg-app-primary" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[12px] text-app-muted">Target ₦80,000</div>
            <Link href="/app/contribute">
              <Button variant="outline" className="h-9 px-4 text-[13px]">
                Add money
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

