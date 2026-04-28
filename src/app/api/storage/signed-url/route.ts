import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    bucket: url.searchParams.get("bucket"),
    path: url.searchParams.get("path"),
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!parsed.data.path.startsWith(`${data.user.id}/`)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { data: signed, error } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUrl(parsed.data.path, 60 * 5);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ ok: false, message: "Could not create signed URL." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}

