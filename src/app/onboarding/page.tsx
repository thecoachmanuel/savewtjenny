"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";

type Slide = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function OnboardingPage() {
  const slides = useMemo<Slide[]>(
    () => [
      {
        title: "Contribute with Confidence",
        description:
          "Join or create a group in minutes. Let’s build your future, one cycle at a time.",
        ctaLabel: "Next",
        ctaHref: "",
      },
      {
        title: "Save Personally, Too",
        description:
          "Create personal goals and automate contributions. Track progress with clarity.",
        ctaLabel: "Next",
        ctaHref: "",
      },
      {
        title: "Transparent Group Savings",
        description:
          "Track contributions, payouts, and cycles with secure records and timely alerts.",
        ctaLabel: "Get started",
        ctaHref: "/auth/sign-up",
      },
    ],
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const active = slides[activeIndex]!;
  const isLast = activeIndex === slides.length - 1;

  return (
    <div className="flex flex-1 items-stretch justify-center px-4 py-6">
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-app-border bg-app-card shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="px-5 pt-6">
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-semibold text-app-fg">
              Savings Groups
            </div>
            <div className="h-10 w-10 rounded-full bg-app-bg" />
          </div>

          <div className="mt-4 flex gap-3">
            <Button className="flex-1" variant="primary">
              Create group
            </Button>
            <Button className="flex-1" variant="outline">
              Join group
            </Button>
          </div>

          <div className="mt-5 space-y-3 pb-44">
            <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-white p-3">
              <div className="h-10 w-10 rounded-xl bg-app-bg" />
              <div className="min-w-0 flex-1">
                <div className="h-3 w-32 rounded bg-app-bg" />
                <div className="mt-2 h-3 w-20 rounded bg-app-bg" />
              </div>
              <div className="h-3 w-8 rounded bg-app-bg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-[92px] rounded-2xl border border-app-border bg-white p-3">
                <div className="h-3 w-20 rounded bg-app-bg" />
                <div className="mt-2 h-3 w-14 rounded bg-app-bg" />
              </div>
              <div className="h-[92px] rounded-2xl border border-app-border bg-white p-3">
                <div className="h-3 w-24 rounded bg-app-bg" />
                <div className="mt-2 h-3 w-16 rounded bg-app-bg" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-4 mb-5 rounded-[26px] bg-app-primary px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-6 text-white shadow-[0_18px_60px_rgba(31,91,255,0.45)]">
            <div className="text-[18px] font-semibold leading-6">
              {active.title}
            </div>
            <div className="mt-2 text-[13px] leading-5 text-white/85">
              {active.description}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Link
                href="/auth/sign-in"
                className="text-[13px] font-medium text-white/90"
              >
                Skip
              </Link>

              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <div
                    key={idx}
                    className={[
                      "h-1.5 rounded-full transition-all",
                      idx === activeIndex ? "w-6 bg-white" : "w-2 bg-white/45",
                    ].join(" ")}
                  />
                ))}
              </div>

              {isLast ? (
                <Link href={active.ctaHref}>
                  <Button
                    variant="inverted"
                    className="h-10 px-4 text-[13px]"
                  >
                    {active.ctaLabel}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="inverted"
                  className="h-10 px-4 text-[13px]"
                  onClick={() => setActiveIndex((v) => Math.min(v + 1, 2))}
                >
                  {active.ctaLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

