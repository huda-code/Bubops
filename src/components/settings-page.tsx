"use client";

import {
  Building2,
  CheckCircle2,
  Database,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";

type MeResponse = {
  user?: {
    email?: string;
    name?: string | null;
  };
  workspace?: {
    name?: string;
    role?: string;
    plan?: string;
    status?: string;
    monthlyOrdersUsed?: number;
    orderLimit?: number;
  };
};

export default function SettingsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          throw new Error("Unable to load settings");
        }

        setMe(await response.json());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load settings",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  return (
    <AppShell
      email={me?.user?.email ?? "BubOps user"}
      role={me?.workspace?.role ?? "OWNER"}
      plan={me?.workspace?.plan ?? "free"}
      title="Settings"
      description="Review your workspace, account, and integrations"
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading settings...
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-2">
            <SettingsCard
              icon={UserRound}
              iconClass="bg-blue-100 text-blue-700"
              title="Account"
              rows={[
                {
                  label: "Name",
                  value: me?.user?.name ?? "Workspace Owner",
                },
                {
                  label: "Email",
                  value: me?.user?.email ?? "Not available",
                },
                {
                  label: "Role",
                  value: me?.workspace?.role ?? "OWNER",
                },
                {
                  label: "Authentication",
                  value: "Auth0",
                },
              ]}
            />

            <SettingsCard
              icon={Building2}
              iconClass="bg-violet-100 text-violet-700"
              title="Workspace"
              rows={[
                {
                  label: "Business",
                  value:
                    me?.workspace?.name ?? "My BubOps Laundry",
                },
                {
                  label: "Status",
                  value: me?.workspace?.status ?? "ACTIVE",
                },
                {
                  label: "Plan",
                  value: me?.workspace?.plan ?? "free",
                },
                {
                  label: "Monthly usage",
                  value: `${me?.workspace?.monthlyOrdersUsed ?? 0}/${
                    me?.workspace?.orderLimit ?? 25
                  } orders`,
                },
              ]}
            />
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold">
                Platform Integrations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Core services powering BubOps
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <IntegrationCard
                icon={ShieldCheck}
                name="Auth0"
                description="Authentication, login sessions, and secure user identity."
                status="Connected"
              />

              <IntegrationCard
                icon={WalletCards}
                name="Stripe"
                description="Checkout, subscriptions, webhooks, and Billing Portal."
                status="Connected"
              />

              <IntegrationCard
                icon={Database}
                name="Prisma"
                description="Typed access to the PostgreSQL multi-tenant database."
                status="Connected"
              />
            </div>
          </section>

          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <LockKeyhole className="h-5 w-5" />
                </span>

                <div>
                  <h3 className="font-bold">Security</h3>
                  <p className="text-sm text-slate-500">
                    Authentication is managed by Auth0
                  </p>
                </div>
              </div>

              <a
                href="/auth/logout"
                className="mt-6 inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Log out of BubOps
              </a>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Mail className="h-5 w-5" />
                </span>

                <div>
                  <h3 className="font-bold">Notifications</h3>
                  <p className="text-sm text-slate-500">
                    Operational alerts and email notifications
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="mt-6 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 opacity-60"
              >
                Coming soon
              </button>
            </article>
          </section>
        </>
      )}
    </AppShell>
  );
}

function SettingsCard({
  icon: Icon,
  iconClass,
  title,
  rows,
}: {
  icon: typeof UserRound;
  iconClass: string;
  title: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="mt-6 divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <span className="text-sm text-slate-500">
              {row.label}
            </span>

            <span className="text-right text-sm font-semibold capitalize text-slate-800">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function IntegrationCard({
  icon: Icon,
  name,
  description,
  status,
}: {
  icon: typeof ShieldCheck;
  name: string;
  description: string;
  status: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {status}
        </span>
      </div>

      <h3 className="mt-5 font-bold">{name}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}