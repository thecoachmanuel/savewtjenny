import { Card } from "@/components/ui";
import { formatKobo } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TxRow = {
  reference: string;
  status: string | null;
  amount_kobo: number | null;
  currency: string | null;
  paid_at: string | null;
  created_at: string;
};

export default async function AdminTransactionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("paystack_transactions")
    .select("reference,status,amount_kobo,currency,paid_at,created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<TxRow[]>();

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <div className="text-[14px] font-semibold text-app-fg">Transactions</div>
        <div className="mt-1 text-[12px] text-app-muted">Latest 50</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-app-bg text-app-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Paid at</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((t) => {
              const amount = formatKobo(t.amount_kobo, t.currency ?? "NGN");
              return (
                <tr key={t.reference} className="border-t border-app-border">
                  <td className="px-5 py-3 font-semibold text-app-fg">{t.reference}</td>
                  <td className="px-5 py-3 text-app-fg">{amount}</td>
                  <td className="px-5 py-3 text-app-fg">{t.status ?? "-"}</td>
                  <td className="px-5 py-3 text-app-fg">
                    {t.paid_at ? new Date(t.paid_at).toLocaleString() : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
