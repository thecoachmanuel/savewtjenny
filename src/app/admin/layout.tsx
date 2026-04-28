import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, CreditCard, LayoutGrid, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/sign-in");

  const profile = await supabase
    .from("profiles")
    .select("role,first_name,last_name")
    .eq("id", data.user.id)
    .maybeSingle<{ role: string | null; first_name: string | null; last_name: string | null }>();

  if (profile.data?.role !== "admin") redirect("/app/home");

  return {
    name:
      (profile.data?.first_name ?? "Admin") +
      (profile.data?.last_name ? ` ${profile.data.last_name}` : ""),
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-[100dvh] w-full items-stretch justify-center bg-app-bg px-4 py-6">
      <div className="w-full max-w-[1100px]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[18px] font-semibold text-app-fg">Admin</div>
            <div className="mt-1 text-[13px] text-app-muted">{admin.name}</div>
          </div>
          <Link
            href="/app/home"
            className="rounded-xl border border-app-border bg-white px-4 py-2 text-[13px] font-semibold text-app-fg"
          >
            Back to app
          </Link>
        </div>

        <Card className="mt-5 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
            >
              <LayoutGrid className="h-4 w-4 text-app-primary" />
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
            >
              <Users className="h-4 w-4 text-app-primary" />
              Users
            </Link>
            <Link
              href="/admin/groups"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
            >
              <BarChart3 className="h-4 w-4 text-app-primary" />
              Groups
            </Link>
            <Link
              href="/admin/transactions"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
            >
              <CreditCard className="h-4 w-4 text-app-primary" />
              Transactions
            </Link>
          </div>
        </Card>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
