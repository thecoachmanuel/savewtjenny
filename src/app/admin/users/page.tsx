import { Card } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email,role,is_verified,created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<UserRow[]>();

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <div className="text-[14px] font-semibold text-app-fg">Users</div>
        <div className="mt-1 text-[12px] text-app-muted">Latest 50</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-app-bg text-app-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Verified</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-app-border">
                <td className="px-5 py-3 font-semibold text-app-fg">
                  {(u.first_name ?? "User") + (u.last_name ? ` ${u.last_name}` : "")}
                </td>
                <td className="px-5 py-3 text-app-fg">{u.email ?? "-"}</td>
                <td className="px-5 py-3 text-app-fg">{u.role}</td>
                <td className="px-5 py-3 text-app-fg">{u.is_verified ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

