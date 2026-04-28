"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  Plus,
  ReceiptText,
  User,
  type LucideIcon,
} from "lucide-react";

type Tab = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const tabs: Tab[] = [
  { href: "/app/home", label: "Home", Icon: Home },
  { href: "/app/contributions", label: "Contributions", Icon: Wallet },
  { href: "/app/contribute", label: "Contribute", Icon: Plus },
  { href: "/app/transactions", label: "Transactions", Icon: ReceiptText },
  { href: "/app/account", label: "Account", Icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 items-stretch justify-center px-3 py-4">
      <div className="relative flex w-full max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-app-border bg-app-bg shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="flex-1 overflow-y-auto pb-[calc(92px+env(safe-area-inset-bottom))]">
          {children}
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-4 mb-4 rounded-[26px] border border-app-border bg-white/95 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="grid grid-cols-5 items-end">
              {tabs.map(({ href, label, Icon }) => {
                const isActive =
                  pathname === href || (href !== "/app/home" && pathname.startsWith(href));

                const isCenter = href === "/app/contribute";

                if (isCenter) {
                  return (
                    <div key={href} className="flex items-center justify-center">
                      <Link
                        href={href}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-app-primary text-white shadow-[0_18px_40px_rgba(31,91,255,0.45)]"
                        aria-label={label}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center justify-end gap-1 pb-1"
                  >
                    <Icon
                      className={[
                        "h-[18px] w-[18px]",
                        isActive ? "text-app-primary" : "text-app-muted",
                      ].join(" ")}
                    />
                    <div
                      className={[
                        "text-[10px] font-medium",
                        isActive ? "text-app-primary" : "text-app-muted",
                      ].join(" ")}
                    >
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

