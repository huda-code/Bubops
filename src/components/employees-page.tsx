"use client";

import {
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
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
  };
};

const roles = [
  {
    name: "Owner",
    description:
      "Full access to workspace operations, employees, and Stripe billing.",
    icon: ShieldCheck,
    className: "bg-violet-100 text-violet-700",
  },
  {
    name: "Employee",
    description:
      "Can manage customers, create orders, and update operational records.",
    icon: UsersRound,
    className: "bg-blue-100 text-blue-700",
  },
  {
    name: "Driver",
    description:
      "Can view assigned pickups and deliveries without billing access.",
    icon: Truck,
    className: "bg-emerald-100 text-emerald-700",
  },
];

export default function EmployeesPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          throw new Error("Unable to load team information");
        }

        setMe(await response.json());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load team information",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, []);

  return (
    <AppShell
      email={me?.user?.email ?? "BubOps user"}
      role={me?.workspace?.role ?? "OWNER"}
      plan={me?.workspace?.plan ?? "free"}
      title="Employees & Access"
      description="Manage workspace members and role-based permissions"
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;

          return (
            <article
              key={role.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${role.className}`}
              >
                <Icon className="h-6 w-6" />
              </span>

              <h2 className="mt-5 text-xl font-bold">
                {role.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {role.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Workspace Members</h2>
            <p className="mt-1 text-sm text-slate-500">
              Authenticated users and assigned workspace roles
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Auth0 organization invitations are the next integration"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white opacity-60"
          >
            Invite employee
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading members...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Workspace</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Authentication</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <UserRound className="h-5 w-5" />
                      </span>

                      <div>
                        <p className="font-semibold">
                          {me?.user?.name ?? "Workspace Owner"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {me?.user?.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {me?.workspace?.name ?? "My BubOps Laundry"}
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {me?.workspace?.role ?? "OWNER"}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Auth0
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-bold text-blue-950">
          Multi-tenant access architecture
        </h3>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Auth0 authenticates each member. Prisma stores the member’s
          workspace relationship and role. Every customer, order,
          subscription, delivery, usage event, and audit log is queried
          through the authenticated workspace.
        </p>
      </section>
    </AppShell>
  );
}