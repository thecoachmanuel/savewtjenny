"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button, Card, Input } from "@/components/ui";

type CreateResponse =
  | { ok: true; id: string; invite_code: string }
  | { ok: false; message: string };

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("25000");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [cycles, setCycles] = useState("6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setError(null);
    setLoading(true);

    const resp = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        contribution_amount: Number(amount),
        cycle_frequency: frequency,
        total_cycles: Number(cycles),
        currency: "NGN",
      }),
    });

    const json = (await resp.json()) as CreateResponse;
    setLoading(false);

    if (!json.ok) {
      setError(json.message);
      return;
    }

    router.replace(`/app/groups/${json.id}`);
  }

  return (
    <div>
      <AppHeader title="Create group" backHref="/app/groups" />

      <div className="px-5 pt-5 pb-8">
        <Card className="px-5 py-5">
          <div className="text-[13px] font-semibold text-app-fg">Group details</div>
          <div className="mt-1 text-[12px] text-app-muted">
            Set the contribution rules for your savings cycle.
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Group name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Vacation" />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Description</div>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you saving for?" />
            </div>
            <div>
              <div className="mb-2 text-[12px] font-medium text-app-muted">Contribution amount (NGN)</div>
              <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-[12px] font-medium text-app-muted">Cycle frequency</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={frequency === "weekly" ? "primary" : "outline"}
                    className="h-10"
                    onClick={() => setFrequency("weekly")}
                  >
                    Weekly
                  </Button>
                  <Button
                    type="button"
                    variant={frequency === "monthly" ? "primary" : "outline"}
                    className="h-10"
                    onClick={() => setFrequency("monthly")}
                  >
                    Monthly
                  </Button>
                </div>
              </div>
              <div>
                <div className="mb-2 text-[12px] font-medium text-app-muted">Total cycles</div>
                <Input value={cycles} onChange={(e) => setCycles(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <Button className="mt-5 w-full" disabled={!name || loading} onClick={onCreate}>
          {loading ? "Creating..." : "Create group"}
        </Button>
      </div>
    </div>
  );
}

