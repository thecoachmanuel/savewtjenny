import { Card } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GroupRow = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number;
  cycle_frequency: string;
  total_cycles: number;
  invite_code: string;
  created_at: string;
};

export default async function AdminGroupsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("groups")
    .select("id,name,currency,contribution_amount,cycle_frequency,total_cycles,invite_code,created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<GroupRow[]>();

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <div className="text-[14px] font-semibold text-app-fg">Groups</div>
        <div className="mt-1 text-[12px] text-app-muted">Latest 50</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-app-bg text-app-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Contribution</th>
              <th className="px-5 py-3 font-semibold">Frequency</th>
              <th className="px-5 py-3 font-semibold">Invite</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((g) => (
              <tr key={g.id} className="border-t border-app-border">
                <td className="px-5 py-3 font-semibold text-app-fg">{g.name}</td>
                <td className="px-5 py-3 text-app-fg">
                  {(g.currency === "NGN" ? "₦" : g.currency) + Number(g.contribution_amount).toFixed(2)}
                </td>
                <td className="px-5 py-3 text-app-fg">
                  {g.cycle_frequency} · {g.total_cycles} cycles
                </td>
                <td className="px-5 py-3 font-semibold text-app-fg">{g.invite_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

