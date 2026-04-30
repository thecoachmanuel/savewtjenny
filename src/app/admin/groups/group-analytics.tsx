"use client";

import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";

type GroupAnalyticsProps = {
  groupId: string;
  groupName: string;
  currency: string;
  contributionAmount: number;
  totalCycles: number;
  cycleFrequency: string;
  memberCount: number;
  paidCount: number;
  currentCycle: number;
  totalContributions: number;
  totalPayouts: number;
  upcomingPayouts: number;
};

export default function GroupAnalytics({
  groupId,
  groupName,
  currency,
  contributionAmount,
  totalCycles,
  cycleFrequency,
  memberCount,
  paidCount,
  currentCycle,
  totalContributions,
  totalPayouts,
  upcomingPayouts,
}: GroupAnalyticsProps) {
  const estimatedCycle = memberCount > 0 ? Math.floor(paidCount / memberCount) + 1 : 1;
  const completionRate = memberCount > 0 ? Math.round((paidCount / (memberCount * estimatedCycle)) * 100) : 0;
  const progressPercentage = Math.min(100, Math.max(0, completionRate));

  return (
    <Card className="px-5 py-5">
      <div className="text-[14px] font-semibold text-app-fg">Group Analytics</div>
      <div className="mt-1 text-[12px] text-app-muted">
        Performance metrics and insights
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="text-[12px] font-semibold text-app-muted">Members</div>
          <div className="mt-1 text-[20px] font-semibold text-app-fg">{memberCount}</div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="text-[12px] font-semibold text-app-muted">Current Cycle</div>
          <div className="mt-1 text-[20px] font-semibold text-app-fg">#{currentCycle}</div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="text-[12px] font-semibold text-app-muted">Completion Rate</div>
          <div className="mt-1 text-[20px] font-semibold text-app-fg">{completionRate}%</div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="text-[12px] font-semibold text-app-muted">Upcoming Payouts</div>
          <div className="mt-1 text-[20px] font-semibold text-app-fg">{upcomingPayouts}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12px] font-semibold text-app-muted">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-app-border">
          <div 
            className="h-2 rounded-full bg-app-primary" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="text-[12px] font-semibold text-app-muted">Total Contributions</div>
          <div className="mt-1 text-[16px] font-semibold text-app-fg">
            {formatMoney(totalContributions, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="text-[12px] font-semibold text-app-muted">Total Payouts</div>
          <div className="mt-1 text-[16px] font-semibold text-app-fg">
            {formatMoney(totalPayouts, currency)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-blue-50 p-4">
        <div className="text-[12px] font-semibold text-blue-800">Group Details</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
          <div className="text-app-muted">Contribution Amount</div>
          <div className="text-app-fg font-semibold">
            {formatMoney(contributionAmount, currency)}
          </div>
          
          <div className="text-app-muted">Cycle Frequency</div>
          <div className="text-app-fg font-semibold">{cycleFrequency}</div>
          
          <div className="text-app-muted">Total Cycles</div>
          <div className="text-app-fg font-semibold">{totalCycles}</div>
        </div>
      </div>
    </Card>
  );
}