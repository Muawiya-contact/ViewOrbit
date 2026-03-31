"use client";

import { useEffect, useState } from "react";

interface ConversionSettings {
  pointsPerUnit: number;
  pkrPerUnit: number;
  minPayoutPoints: number;
}

const fallback: ConversionSettings = {
  pointsPerUnit: 1000,
  pkrPerUnit: 100,
  minPayoutPoints: 1000,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ConversionSettings>(fallback);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const payload = (await response.json()) as { settings?: ConversionSettings; error?: string };
      if (response.ok && payload.settings) {
        setSettings(payload.settings);
      }
    };

    void load();
  }, []);

  const update = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const payload = (await response.json()) as { settings?: ConversionSettings; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update settings");
      }

      if (payload.settings) {
        setSettings(payload.settings);
      }

      setMessage("Conversion settings updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Admin Settings</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="block text-sm text-slate-200">
          Points per unit
          <input
            type="number"
            value={settings.pointsPerUnit}
            onChange={(event) => setSettings((prev) => ({ ...prev, pointsPerUnit: Number(event.target.value || 1) }))}
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-white"
          />
        </label>

        <label className="block text-sm text-slate-200">
          PKR per unit
          <input
            type="number"
            value={settings.pkrPerUnit}
            onChange={(event) => setSettings((prev) => ({ ...prev, pkrPerUnit: Number(event.target.value || 1) }))}
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-white"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Minimum payout points
          <input
            type="number"
            value={settings.minPayoutPoints}
            onChange={(event) => setSettings((prev) => ({ ...prev, minPayoutPoints: Number(event.target.value || 1) }))}
            className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-white"
          />
        </label>

        <button
          type="button"
          onClick={() => void update()}
          disabled={saving}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </div>
    </div>
  );
}
