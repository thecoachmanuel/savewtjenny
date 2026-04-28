"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function AppHeader({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5 text-app-fg" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5 text-app-fg" />
            </button>
          )}
          <div className="text-[15px] font-semibold text-app-fg">{title}</div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}

