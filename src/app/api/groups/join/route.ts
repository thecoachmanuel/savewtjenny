import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  invite_code: z.string().min(4),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { data: group, error } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", parsed.data.invite_code)
    .single<{ id: string }>();

  if (error || !group) {
    return NextResponse.json({ ok: false, message: "Group not found." }, { status: 404 });
  }

  const { error: joinError } = await supabase.from("group_members").upsert(
    {
      group_id: group.id,
      user_id: data.user.id,
      role: "member",
      position: 9999,
    },
    { onConflict: "group_id,user_id" },
  );

  if (joinError) {
    return NextResponse.json({ ok: false, message: "Could not join group." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: group.id });
}

