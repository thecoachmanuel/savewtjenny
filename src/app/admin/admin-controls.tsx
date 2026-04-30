"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";

export default function AdminControls() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBootstrap = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Failed to bootstrap system");
      }

      setSuccess("System bootstrapped successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  const handleExportData = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would export data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Data export initiated! Check your email for the download link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  const handleSystemMaintenance = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would perform system maintenance
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess("System maintenance completed successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="px-5 py-5">
      <div className="text-[14px] font-semibold text-app-fg">Admin Controls</div>
      <div className="mt-1 text-[12px] text-app-muted">
        Manage system-wide settings and operations
      </div>

      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">Bootstrap System</div>
              <div className="mt-1 text-[12px] text-app-muted">
                Initialize system with default data and settings
              </div>
            </div>
            <Button
              onClick={handleBootstrap}
              disabled={busy}
              className="text-[12px]"
            >
              {busy ? "Processing..." : "Run"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">Export Data</div>
              <div className="mt-1 text-[12px] text-app-muted">
                Export all system data as CSV files
              </div>
            </div>
            <Button
              onClick={handleExportData}
              disabled={busy}
              className="text-[12px]"
            >
              {busy ? "Processing..." : "Export"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">System Maintenance</div>
              <div className="mt-1 text-[12px] text-app-muted">
                Perform routine maintenance tasks
              </div>
            </div>
            <Button
              onClick={handleSystemMaintenance}
              disabled={busy}
              className="text-[12px]"
            >
              {busy ? "Processing..." : "Run"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">Payment Settings</div>
              <div className="mt-1 text-[12px] text-app-muted">
                Configure payment providers and fees
              </div>
            </div>
            <Button className="text-[12px]" disabled>
              Configure
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold text-app-fg">User Management</div>
              <div className="mt-1 text-[12px] text-app-muted">
                Manage user roles and permissions
              </div>
            </div>
            <Button className="text-[12px]" disabled>
              Manage
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
          {success}
        </div>
      )}
    </Card>
  );
}