import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (email !== "admin@savewithjenny.com" || password !== "admin123") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) return NextResponse.json({ ok: false, message: listError.message }, { status: 500 });

  const existing = (users.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);

  let userId: string | null = existing?.id ?? null;
  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) return NextResponse.json({ ok: false, message: createError.message }, { status: 500 });
    userId = created.user?.id ?? null;
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateError) return NextResponse.json({ ok: false, message: updateError.message }, { status: 500 });
  }

  if (!userId) return NextResponse.json({ ok: false, message: "Failed to create admin user" }, { status: 500 });

  const { error: upsertError } = await admin
    .from("profiles")
    .upsert({ id: userId, email, role: "admin" }, { onConflict: "id" });
  if (upsertError) return NextResponse.json({ ok: false, message: upsertError.message }, { status: 500 });

  const { error: roleError } = await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
  if (roleError) return NextResponse.json({ ok: false, message: roleError.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 200 });
}

