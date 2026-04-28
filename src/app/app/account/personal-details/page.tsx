"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button, Card, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Profile = {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  country: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
};

export default function PersonalDetailsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        setError("Please sign in again.");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(
          "first_name,middle_name,last_name,phone,email,date_of_birth,country,avatar_url,is_verified",
        )
        .eq("id", user.id)
        .maybeSingle<Profile>();

      if (!cancelled) {
        if (profileError) setError(profileError.message);
        setProfile(
          data ?? {
            first_name: null,
            middle_name: null,
            last_name: null,
            phone: null,
            email: user.email ?? null,
            date_of_birth: null,
            country: null,
            avatar_url: null,
            is_verified: null,
          },
        );
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onPickFile() {
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError("Please sign in again.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProfile((p) => (p ? { ...p, avatar_url: publicUrl.publicUrl } : p));
  }

  async function onSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setSaving(false);
      setError("Please sign in again.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        middle_name: profile.middle_name,
        last_name: profile.last_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        country: profile.country,
      })
      .eq("id", user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    }
  }

  return (
    <div>
      <AppHeader title="Personal Details" backHref="/app/account" />

      <div className="px-5 pt-5 pb-8">
        <Card className="px-5 py-5">
          <div className="flex flex-col items-center">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile photo"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-app-bg" />
            )}

            <button
              type="button"
              onClick={onPickFile}
              className="mt-3 text-[12px] font-semibold text-app-primary"
            >
              Edit picture
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">First Name</div>
              <Input
                value={profile?.first_name ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, first_name: e.target.value } : p))}
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Middle Name</div>
              <Input
                value={profile?.middle_name ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, middle_name: e.target.value } : p))}
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Last Name</div>
              <Input
                value={profile?.last_name ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, last_name: e.target.value } : p))}
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Phone Number</div>
              <Input
                value={profile?.phone ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, phone: e.target.value } : p))}
                disabled={loading}
                placeholder="08012345678"
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Email Address</div>
              <Input value={profile?.email ?? ""} disabled />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Date of Birth</div>
              <Input
                value={profile?.date_of_birth ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, date_of_birth: e.target.value } : p))}
                disabled={loading}
                placeholder="10 March 1960"
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Country of Residence</div>
              <Input
                value={profile?.country ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, country: e.target.value } : p))}
                disabled={loading}
                placeholder="Nigeria"
              />
            </div>
          </div>
        </Card>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <Button className="mt-5 w-full" onClick={onSave} disabled={saving || loading}>
          {saving ? "Saving..." : "Edit profile"}
        </Button>
      </div>
    </div>
  );
}
