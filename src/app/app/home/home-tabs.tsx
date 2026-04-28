"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Plus } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { MaskedAmount } from "@/components/masked-amount";

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
  href?: string;
};

export function HomeTabs({
  firstName,
  activeGroup,
  formattedContribution,
  paidCycles,
  recentMessages,
  activity,
}: {
  firstName: string;
  activeGroup: Group | null;
  formattedContribution: string;
  paidCycles: number;
  recentMessages: MessageRow[];
  activity: ActivityItem[];
}) {
  const [tab, setTab] = useState<"chat" | "activity">("chat");

  const completedText = useMemo(() => {
    const total = activeGroup?.total_cycles ?? 0;
    return `${Math.min(paidCycles, total)} of ${total} cycles completed.`;
  }, [activeGroup?.total_cycles, paidCycles]);

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]" />
          <div className="min-w-0">
            <div className="text-[12px] text-app-muted">Hello, {firstName} 👋</div>
            <div className="mt-0.5 truncate text-[14px] font-semibold text-app-fg">
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
        <MaskedAmount value={formattedContribution} />

        <div className="mt-4 rounded-2xl border border-app-border bg-app-bg px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-white text-[12px] font-semibold text-app-fg">
                {Math.min(paidCycles + 1, activeGroup?.total_cycles ?? 1)}x
              </div>
              <div>
                <div className="text-[13px] font-semibold text-app-fg">Next contribution</div>
                <div className="mt-0.5 text-[12px] text-app-muted">{completedText}</div>
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
            <button
              type="button"
              onClick={() => setTab("chat")}
              className={[
                "pb-2 text-[13px] font-semibold",
                tab === "chat" ? "border-b-2 border-app-primary text-app-fg" : "text-app-muted",
              ].join(" ")}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setTab("activity")}
              className={[
                "pb-2 text-[13px] font-semibold",
                tab === "activity" ? "border-b-2 border-app-primary text-app-fg" : "text-app-muted",
              ].join(" ")}
            >
              Activity
            </button>
          </div>
          <Link
            href="/app/groups"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            aria-label="Groups"
          >
            <Plus className="h-4 w-4 text-app-fg" />
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {tab === "chat" ? (
            <>
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
            </>
          ) : (
            <>
              {activity.map((item) => {
                const dt = new Date(item.ts);
                const time = dt.toLocaleString("en-NG", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const status =
                  item.status === "success"
                    ? "Success"
                    : item.status === "failed"
                      ? "Failed"
                      : item.status === "paid"
                        ? "Paid"
                        : item.status === "pending"
                          ? "Pending"
                          : item.status;
                const tone =
                  status === "Success" || status === "Paid"
                    ? "text-emerald-600"
                    : status === "Failed"
                      ? "text-app-danger"
                      : "text-amber-600";
                const content = (
                  <Card className="px-4 py-3 transition-colors hover:bg-app-bg active:bg-app-bg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-app-bg" />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-app-fg">
                            {item.title}
                          </div>
                          <div className="mt-0.5 truncate text-[12px] text-app-muted">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.amount ? (
                          <div className="text-[13px] font-semibold text-app-fg">{item.amount}</div>
                        ) : null}
                        <div className="mt-0.5 text-[11px] text-app-muted">{time}</div>
                        {status ? (
                          <div className={`mt-0.5 text-[11px] font-semibold ${tone}`}>{status}</div>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );

                return item.href ? (
                  <Link key={item.id} href={item.href} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })}
              {activity.length === 0 ? (
                <div className="rounded-3xl border border-app-border bg-white px-5 py-6 text-center text-[13px] text-app-muted">
                  No activity yet.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
