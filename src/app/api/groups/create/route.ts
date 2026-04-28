import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  contribution_amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("NGN"),
  cycle_frequency: z.enum(["weekly", "monthly"]),
  total_cycles: z.number().int().min(1).max(120),
});

function randomInviteCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chunk = (n: number) =>
    Array.from({ length: n })
      .map(() => letters[Math.floor(Math.random() * letters.length)]!)
      .join("");
  const numbers = Math.floor(1000 + Math.random() * 9000);
  return `${chunk(4)}-${numbers}-${chunk(4)}`;
}

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

  const inviteCode = randomInviteCode();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      contribution_amount: parsed.data.contribution_amount,
      currency: parsed.data.currency,
      cycle_frequency: parsed.data.cycle_frequency,
      total_cycles: parsed.data.total_cycles,
      invite_code: inviteCode,
      created_by: data.user.id,
    })
    .select("id,invite_code")
    .single<{ id: string; invite_code: string }>();

  if (error || !group) {
    return NextResponse.json({ ok: false, message: "Could not create group." }, { status: 400 });
  }

  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: data.user.id,
    role: "group_admin",
    position: 1,
  });

  return NextResponse.json({ ok: true, id: group.id, invite_code: group.invite_code });
}

