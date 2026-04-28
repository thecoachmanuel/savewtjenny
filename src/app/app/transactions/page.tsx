import { Search } from "lucide-react";
import { Card, Chip, Input } from "@/components/ui";
import { formatKobo } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TxRow = {
  reference: string;
  amount_kobo: number | null;
  currency: string | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const txResult = await supabase
    .from("paystack_transactions")
    .select("reference,amount_kobo,currency,status,paid_at,created_at,metadata")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<TxRow[]>();

  const groupsResult = await supabase
    .from("group_members")
    .select("groups:groups(id,name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(10)
    .returns<Array<{ groups: { id: string; name: string } | null }>>();

  const groupNames = (groupsResult.data ?? []).flatMap((r) => (r.groups ? [r.groups.name] : []));

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
        {groupNames.slice(0, 2).map((name) => (
          <Chip key={name}>{name}</Chip>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {(txResult.data ?? []).map((row) => {
          const meta = (row.metadata ?? {}) as Record<string, unknown>;
          const groupName = typeof meta.group_name === "string" ? meta.group_name : null;
          const purpose = typeof meta.purpose === "string" ? meta.purpose : null;

          const title =
            purpose === "personal_savings"
              ? "Personal savings"
              : groupName
                ? `Contribution · ${groupName}`
                : "Contribution";

          const dt = new Date(row.paid_at ?? row.created_at);
          const time = dt.toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

          const status = row.status ?? "pending";
          const statusLabel =
            status === "success" ? "Success" : status === "failed" ? "Failed" : status === "initialized" ? "Pending" : status;

          const statusClass =
            statusLabel === "Success"
              ? "text-emerald-600"
              : statusLabel === "Failed"
                ? "text-app-danger"
                : "text-amber-600";

          return (
          <Card key={row.reference} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-app-bg" />
                <div>
                  <div className="text-[13px] font-semibold text-app-fg">{title}</div>
                  <div className="mt-0.5 text-[12px] text-app-muted">{time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-app-fg">
                  {formatKobo(row.amount_kobo, row.currency ?? "NGN")}
                </div>
                <div className={`mt-0.5 text-[12px] font-medium ${statusClass}`}>{statusLabel}</div>
              </div>
            </div>
          </Card>
          );
        })}

        {(txResult.data ?? []).length === 0 ? (
          <div className="rounded-3xl border border-app-border bg-white px-5 py-6 text-center text-[13px] text-app-muted">
            No transactions yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
