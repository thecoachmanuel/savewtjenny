"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignUpPage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = supabaseRef.current ?? createSupabaseBrowserClient();
    supabaseRef.current = supabase;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      router.replace("/auth/sign-in");
      return;
    }

    router.replace("/app/home");
  }

  return (
    <div className="flex flex-1 items-stretch justify-center px-4 py-8">
      <div className="w-full max-w-[420px] rounded-[28px] border border-app-border bg-app-card px-5 py-7 shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="text-center">
          <div className="text-[20px] font-semibold text-app-fg">Create account</div>
          <div className="mt-1 text-[13px] text-app-muted">
            Start personal goals or join a savings group.
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">
                First name
              </div>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jenny"
                required
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">
                Last name
              </div>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[12px] font-medium text-app-muted">Email</div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="mb-2 text-[12px] font-medium text-app-muted">
              Password
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="mt-5 text-center text-[13px] text-app-muted">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-medium text-app-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
