"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button, Card, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type PayoutAccount = {
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
};

export default function PaymentSetupPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<PayoutAccount>({
    bank_name: "",
    account_number: "",
    account_name: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        setError("Please sign in again.");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("payout_accounts")
        .select("bank_name,account_number,account_name")
        .eq("user_id", userData.user.id)
        .maybeSingle<PayoutAccount>();

      if (cancelled) return;
      if (loadError) setError(loadError.message);
      setForm({
        bank_name: data?.bank_name ?? "",
        account_number: data?.account_number ?? "",
        account_name: data?.account_name ?? "",
      });
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onSave() {
    setError(null);
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      setError("Please sign in again.");
      return;
    }

    const { error: upsertError } = await supabase.from("payout_accounts").upsert({
      user_id: userData.user.id,
      bank_name: form.bank_name,
      account_number: form.account_number,
      account_name: form.account_name,
    });

    setSaving(false);
    if (upsertError) setError(upsertError.message);
  }

  return (
    <div>
      <AppHeader title="Payment Setup" backHref="/app/account" />

      <div className="px-5 pt-5 pb-8">
        <Card className="px-5 py-5">
          <div className="text-[13px] font-semibold text-app-fg">Payout details</div>
          <div className="mt-1 text-[12px] text-app-muted">
            Add your bank details to receive payouts on your turn.
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Bank name</div>
              <Input
                placeholder="e.g. First Bank"
                value={form.bank_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Account number</div>
              <Input
                placeholder="0123456789"
                inputMode="numeric"
                value={form.account_number ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    account_number: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Account name</div>
              <Input
                placeholder="Jenny Doe"
                value={form.account_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                disabled={loading}
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
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
