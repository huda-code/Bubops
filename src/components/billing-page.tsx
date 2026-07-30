"use client";

import {
  Check,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";

type MeResponse = {
  user?: {
    email?: string;
  };
  workspace?: {
    role?: string;
    plan?: string;
    status?: string;
    monthlyOrdersUsed?: number;
    orderLimit?: number;
  };
};

export default function BillingPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/me");

      if (!response.ok) {
        throw new Error("Unable to load billing information");
      }

      const data = await response.json();
      setMe(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load billing information",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const isPro =
    me?.workspace?.plan?.toLowerCase() === "pro";

  const monthlyOrdersUsed =
    me?.workspace?.monthlyOrdersUsed ?? 0;

  const orderLimit =
    me?.workspace?.orderLimit ?? 25;

  const usagePercent = Math.min(
    100,
    Math.round((monthlyOrdersUsed / orderLimit) * 100),
  );

  async function openBilling() {
    try {
      setBillingLoading(true);
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
      setBillingLoading(false);
    }
  }

  return (
    <AppShell
      email={me?.user?.email ?? "BubOps user"}
      role={me?.workspace?.role ?? "OWNER"}
      plan={me?.workspace?.plan ?? "free"}
      title="Billing & Subscription"
      description="Manage your BubOps plan and monthly usage"
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading billing information...
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-7 shadow-sm">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
                      <Sparkles className="h-6 w-6" />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-violet-700">
                        Current plan
                      </p>

                      <h2 className="text-3xl font-bold capitalize">
                        {me?.workspace?.plan ?? "Free"}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-5 max-w-xl text-sm leading-6 text-slate-600">
                    {isPro
                      ? "Your BubOps Pro subscription is active. You have increased monthly order capacity and access to Stripe-managed billing."
                      : "Upgrade to BubOps Pro to increase your monthly order capacity and unlock advanced operational features."}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                    isPro
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isPro ? "Active" : "Free"}
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => void openBilling()}
                  disabled={billingLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />

                  {billingLoading
                    ? "Opening Stripe..."
                    : isPro
                      ? "Manage billing"
                      : "Upgrade to Pro"}

                  <ExternalLink className="h-4 w-4" />
                </button>

                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Securely managed by Stripe
                </span>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Monthly usage
              </p>

              <p className="mt-3 text-4xl font-bold">
                {monthlyOrdersUsed}
                <span className="text-xl text-slate-400">
                  /{orderLimit}
                </span>
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Orders used this billing period
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all"
                  style={{
                    width: `${usagePercent}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>{usagePercent}% used</span>
                <span>
                  {Math.max(0, orderLimit - monthlyOrdersUsed)} remaining
                </span>
              </div>
            </article>
          </section>

          <section className="mt-7 grid gap-6 md:grid-cols-2">
            <PlanCard
              name="Free"
              price="$0"
              description="For small laundry teams testing BubOps."
              features={[
                "Up to 25 orders per month",
                "Customer management",
                "Order tracking",
                "Auth0-secured workspace",
              ]}
              active={!isPro}
            />

            <PlanCard
              name="Pro"
              price="$49"
              description="For growing laundry businesses."
              features={[
                "Up to 1,000 orders per month",
                "Stripe Billing Portal",
                "Role-aware access",
                "Usage tracking",
                "Priority operational tools",
              ]}
              active={isPro}
              highlighted
            />
          </section>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function PlanCard({
  name,
  price,
  description,
  features,
  active,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  active: boolean;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-7 shadow-sm ${
        highlighted
          ? "border-violet-300 bg-gradient-to-br from-white to-violet-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">{name}</h3>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        {active ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Current
          </span>
        ) : null}
      </div>

      <p className="mt-6 text-4xl font-bold">
        {price}
        <span className="text-base font-medium text-slate-500">
          /month
        </span>
      </p>

      <div className="mt-6 space-y-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-3 text-sm text-slate-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-700" />
            </span>

            {feature}
          </div>
        ))}
      </div>
    </article>
  );
}