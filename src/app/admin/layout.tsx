import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminNav from "./admin-nav";

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

  const isAdminEmail = data.user.email === "admin@savewithjenny.com";

  if (isAdminEmail && profile.data?.role !== "admin") {
    const admin = createSupabaseAdminClient();
    await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    const refreshed = await supabase
      .from("profiles")
      .select("role,first_name,last_name")
      .eq("id", data.user.id)
      .maybeSingle<{ role: string | null; first_name: string | null; last_name: string | null }>();
    if (refreshed.data) {
      profile.data = refreshed.data;
    }
  }

  if (!isAdminEmail && profile.data?.role !== "admin") redirect("/app/home");

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

        <AdminNav />

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}