"use client";

import { useState } from "react";

type BillingButtonProps = {
  isPro: boolean;
};

export default function BillingButton({
  isPro,
}: BillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBilling() {
    try {
      setLoading(true);
      setError(null);

      const endpoint = isPro
        ? "/api/stripe/portal"
        : "/api/stripe/checkout";

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error ?? "Unable to open Stripe billing",
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open Stripe billing",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleBilling}
        disabled={loading}
        className="rounded-lg border border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Opening Stripe..."
          : isPro
            ? "Manage billing"
            : "Upgrade to Pro"}
      </button>

      {error ? (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}