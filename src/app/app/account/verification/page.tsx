"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, UploadCloud } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button, Card } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type StepKey = "proof_of_address" | "identity";

type KycRow = {
  id: string;
  doc_type: StepKey;
  file_bucket: string;
  file_path: string;
  created_at: string;
};

async function openSignedUrl(bucket: string, path: string) {
  const url = new URL("/api/storage/signed-url", window.location.origin);
  url.searchParams.set("bucket", bucket);
  url.searchParams.set("path", path);

  const resp = await fetch(url.toString());
  const json = (await resp.json()) as { ok: boolean; url?: string };
  if (json.ok && json.url) {
    window.open(json.url, "_blank", "noopener,noreferrer");
  }
}

export default function VerificationPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const proofRef = useRef<HTMLInputElement | null>(null);
  const identityRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<Record<StepKey, KycRow | null>>({
    proof_of_address: null,
    identity: null,
  });
  const [loading, setLoading] = useState(true);
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

      const { data, error: listError } = await supabase
        .from("kyc_documents")
        .select("id,doc_type,file_bucket,file_path,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .returns<KycRow[]>();

      if (cancelled) return;

      if (listError) {
        setError(listError.message);
        setLoading(false);
        return;
      }

      const next: Record<StepKey, KycRow | null> = {
        proof_of_address: null,
        identity: null,
      };

      for (const row of data ?? []) {
        if (!next[row.doc_type]) next[row.doc_type] = row;
      }

      setDocs(next);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function upload(step: StepKey, file: File) {
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError("Please sign in again.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const bucket = "kyc";
    const path = `${user.id}/${step}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("kyc_documents")
      .insert({
        user_id: user.id,
        doc_type: step,
        file_bucket: bucket,
        file_path: path,
      })
      .select("id,doc_type,file_bucket,file_path,created_at")
      .single<KycRow>();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDocs((d) => ({ ...d, [step]: inserted }));
  }

  return (
    <div>
      <AppHeader title="Verify Your Identity" backHref="/app/home" />

      <div className="px-5 pt-5 pb-8">
        <div className="text-[12px] text-app-muted">
          Please complete the steps below to verify your account.
        </div>
        <div className="mt-4 space-y-3">
          <Card className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-app-muted">Step 1</div>
                <div className="mt-1 text-[13px] font-semibold text-app-fg">
                  Proof of address
                </div>
              </div>
              {docs.proof_of_address ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-app-muted" />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              {docs.proof_of_address ? (
                <Button
                  variant="outline"
                  className="h-9 px-4 text-[13px]"
                  onClick={() =>
                    void openSignedUrl(
                      docs.proof_of_address!.file_bucket,
                      docs.proof_of_address!.file_path,
                    )
                  }
                >
                  View document
                </Button>
              ) : (
                <Button
                  className="h-9 px-4 text-[13px]"
                  onClick={() => proofRef.current?.click()}
                  disabled={loading}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>
            <input
              ref={proofRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload("proof_of_address", file);
              }}
            />
          </Card>

          <Card className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-app-muted">Step 2</div>
                <div className="mt-1 text-[13px] font-semibold text-app-fg">
                  Identity verification
                </div>
              </div>
              {docs.identity ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-app-muted" />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              {docs.identity ? (
                <Button
                  variant="outline"
                  className="h-9 px-4 text-[13px]"
                  onClick={() =>
                    void openSignedUrl(docs.identity!.file_bucket, docs.identity!.file_path)
                  }
                >
                  View document
                </Button>
              ) : (
                <Button
                  className="h-9 px-4 text-[13px]"
                  onClick={() => identityRef.current?.click()}
                  disabled={loading}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>
            <input
              ref={identityRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload("identity", file);
              }}
            />
          </Card>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <Button className="mt-5 w-full" disabled={!docs.proof_of_address || !docs.identity}>
          Start verification
        </Button>
      </div>
    </div>
  );
}

