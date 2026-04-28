import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Shield, SlidersHorizontal, User } from "lucide-react";
import { Button, Card, Divider } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user!;

  const profileResult = await supabase
    .from("profiles")
    .select("first_name,last_name,avatar_url,is_verified")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const profile = profileResult.data ?? {
    first_name: null,
    last_name: null,
    avatar_url: null,
    is_verified: null,
  };

  const initials =
    (profile.first_name?.[0] ?? "T") + (profile.last_name?.[0] ?? "J");

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="text-[16px] font-semibold text-app-fg">Account</div>

      <Card className="mt-4 px-5 py-5">
        <div className="flex flex-col items-center text-center">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Profile"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-bg text-[18px] font-semibold text-app-fg">
              {initials.toUpperCase()}
            </div>
          )}
          <div className="mt-3 text-[14px] font-semibold text-app-fg">
            {(profile.first_name ?? "Tyler") + " " + (profile.last_name ?? "Jacob")}
          </div>
          <div className="mt-1 text-[12px] text-app-muted">{user.email}</div>
        </div>
      </Card>

      <div className="mt-4 text-[12px] font-semibold text-app-muted">ACCOUNT</div>

      <Card className="mt-2 overflow-hidden">
        <Link
          href="/app/account/personal-details"
          className="flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg">
              <User className="h-5 w-5 text-app-fg" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-app-fg">
                Your Profile
              </div>
              <div className="mt-0.5 text-[12px] text-app-muted">
                Edit your profile information
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-app-muted" />
        </Link>
        <Divider />
        <Link
          href="/app/account/verification"
          className="flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg">
              <Shield className="h-5 w-5 text-app-fg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-semibold text-app-fg">
                  Verification
                </div>
                {profile.is_verified ? (
                  <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Verified
                  </div>
                ) : null}
              </div>
              <div className="mt-0.5 text-[12px] text-app-muted">
                Verify your identity
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-app-muted" />
        </Link>
        <Divider />
        <Link
          href="/app/account/payment-setup"
          className="flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg">
              <SlidersHorizontal className="h-5 w-5 text-app-fg" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-app-fg">
                Payment Setup
              </div>
              <div className="mt-0.5 text-[12px] text-app-muted">
                Setup payment method
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-app-muted" />
        </Link>
      </Card>

      <div className="mt-4 text-[12px] font-semibold text-app-muted">SECURITY</div>

      <Card className="mt-2 overflow-hidden">
        <Link href="/app/account/security" className="flex items-center justify-between px-5 py-4">
          <div className="text-[13px] font-semibold text-app-fg">Security settings</div>
          <ChevronRight className="h-5 w-5 text-app-muted" />
        </Link>
      </Card>

      <form action="/auth/sign-out" method="post" className="mt-5">
        <Button className="w-full" variant="outline">
          Log out
        </Button>
      </form>
    </div>
  );
}
