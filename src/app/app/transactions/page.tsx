import { Search } from "lucide-react";
import { Card, Chip, Input } from "@/components/ui";

type TxRow = {
  name: string;
  amount: string;
  status: "Success" | "Failed" | "Pending";
  direction: "Sent" | "Received";
  time: string;
};

const rows: TxRow[] = [
  { name: "Robert Fox", amount: "$250", status: "Success", direction: "Sent", time: "Mar 6, 12:40" },
  { name: "Brooklyn Simmons", amount: "$250", status: "Success", direction: "Received", time: "Mar 4, 09:12" },
  { name: "Wade Warren", amount: "$250", status: "Pending", direction: "Sent", time: "Mar 1, 08:02" },
  { name: "Jerome Bell", amount: "$250", status: "Success", direction: "Sent", time: "Feb 28, 17:22" },
];

export default async function TransactionsPage() {
  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="text-[16px] font-semibold text-app-fg">Transactions</div>

      <div className="mt-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-4 w-4 text-app-muted" />
          </div>
          <Input className="pl-11" placeholder="Search transactions" />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active>All</Chip>
        <Chip>Summer Vacation</Chip>
        <Chip>Colleagues @ Work</Chip>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row, idx) => (
          <Card key={idx} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-app-bg" />
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">
                    {row.direction} to {row.name}
                  </div>
                  <div className="mt-0.5 text-[12px] text-app-muted">{row.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-app-fg">{row.amount}</div>
                <div
                  className={[
                    "mt-0.5 text-[12px] font-medium",
                    row.status === "Success"
                      ? "text-emerald-600"
                      : row.status === "Failed"
                        ? "text-app-danger"
                        : "text-amber-600",
                  ].join(" ")}
                >
                  {row.status}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

