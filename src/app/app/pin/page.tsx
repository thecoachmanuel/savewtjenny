"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;

export default function PinPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pin, setPin] = useState("");

  async function onLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/sign-in");
  }

  function onPress(value: string) {
    if (pin.length >= 4) return;
    setPin((p) => p + value);
  }

  function onBackspace() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-1 items-stretch justify-center px-4 py-6">
      <div className="w-full max-w-[420px] rounded-[28px] border border-app-border bg-white px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8" />
          <button
            type="button"
            onClick={onLogout}
            className="text-[12px] font-semibold text-red-500"
          >
            Log out
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-app-bg">
            <div className="h-7 w-7 rounded-full border-2 border-app-muted" />
          </div>
          <div className="mt-3 text-[14px] font-semibold text-app-fg">JOHN DOE</div>
          <div className="mt-3 text-[12px] text-app-muted">Enter your account PIN</div>

          <div className="mt-4 flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className={[
                  "h-3 w-3 rounded-full border",
                  idx < pin.length ? "border-app-primary bg-app-primary" : "border-app-border bg-white",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="mt-10 grid w-full grid-cols-3 gap-4">
            {digits.slice(0, 9).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onPress(d)}
                className="h-14 rounded-2xl bg-app-bg text-[18px] font-semibold text-app-fg active:bg-app-border"
              >
                {d}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPin("")}
              className="h-14 rounded-2xl bg-app-bg text-[12px] font-semibold text-app-muted active:bg-app-border"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onPress("0")}
              className="h-14 rounded-2xl bg-app-bg text-[18px] font-semibold text-app-fg active:bg-app-border"
            >
              0
            </button>
            <button
              type="button"
              onClick={onBackspace}
              className="h-14 rounded-2xl bg-app-bg text-[12px] font-semibold text-app-muted active:bg-app-border"
            >
              ⌫
            </button>
          </div>

          <button type="button" className="mt-8 text-[12px] text-app-muted">
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}

