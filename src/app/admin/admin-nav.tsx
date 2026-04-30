import Link from "next/link";
import { BarChart3, CreditCard, LayoutGrid, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui";

export default function AdminNav() {
  return (
    <Card className="mt-5 px-4 py-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
        >
          <LayoutGrid className="h-4 w-4 text-app-primary" />
          Dashboard
        </Link>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
        >
          <Users className="h-4 w-4 text-app-primary" />
          Users
        </Link>
        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
        >
          <BarChart3 className="h-4 w-4 text-app-primary" />
          Groups
        </Link>
        <Link
          href="/admin/payouts"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
        >
          <Wallet className="h-4 w-4 text-app-primary" />
          Group Payouts
        </Link>
        <Link
          href="/admin/personal-goals"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
        >
          <Wallet className="h-4 w-4 text-app-primary" />
          Personal Goal Payouts
        </Link>
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-app-fg hover:bg-app-bg"
        >
          <CreditCard className="h-4 w-4 text-app-primary" />
          Transactions
        </Link>
      </div>
    </Card>
  );
}