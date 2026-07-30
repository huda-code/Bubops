import AppShell from "@/components/app-shell";
import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PlatformBillingPage() {
  const access = await getCurrentAccess();

  if (!access) {
    redirect("/auth/login");
  }

  if (access.role !== "PLATFORM_ADMIN") {
    redirect("/");
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      workspace: {
        memberships: {
          some: {
            role: "OWNER",
          },
        },
      },
    },
    include: {
      workspace: {
        include: {
          memberships: {
            where: {
              role: "OWNER",
            },
            include: {
              user: true,
            },
            take: 1,
          },
          _count: {
            select: {
              orders: true,
              customers: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "ACTIVE",
  );

  const proSubscriptions = subscriptions.filter(
    (subscription) => subscription.plan.toLowerCase() === "pro",
  );

  const estimatedMonthlyRevenue = proSubscriptions.length * 49;

  return (
    <AppShell
      email={access.user.email}
      role={access.role}
      plan="platform"
      title="Plans & Billing"
      description="Monitor tenant subscriptions, Stripe status, usage, and platform revenue."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tenant subscriptions"
          value={subscriptions.length}
          detail="All laundry businesses"
        />

        <MetricCard
          label="Active subscriptions"
          value={activeSubscriptions.length}
          detail="Stripe-active tenants"
        />

        <MetricCard
          label="Pro tenants"
          value={proSubscriptions.length}
          detail="$49 monthly plan"
        />

        <MetricCard
          label="Estimated MRR"
          value={`$${estimatedMonthlyRevenue}`}
          detail="Based on Pro subscriptions"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">
            Tenant billing
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Prisma subscription records synchronized from Stripe.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Heading>Tenant</Heading>
                <Heading>Owner</Heading>
                <Heading>Plan</Heading>
                <Heading>Status</Heading>
                <Heading>Usage</Heading>
                <Heading>Stripe customer</Heading>
                <Heading>Stripe subscription</Heading>
                <Heading>Period end</Heading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((subscription) => {
                const owner =
                  subscription.workspace.memberships[0]?.user;

                return (
                  <tr
                    key={subscription.id}
                    className="hover:bg-slate-50"
                  >
                    <Cell>
                      <p className="font-semibold text-slate-950">
                        {subscription.workspace.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {subscription.workspace.slug}
                      </p>
                    </Cell>

                    <Cell>
                      {owner?.email ??
                        subscription.workspace.businessEmail}
                    </Cell>

                    <Cell>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                        {subscription.plan}
                      </span>
                    </Cell>

                    <Cell>{subscription.status}</Cell>

                    <Cell>
                      {subscription.monthlyOrdersUsed}/
                      {subscription.orderLimit}
                    </Cell>

                    <Cell>
                      {subscription.stripeCustomerId ?? "Not connected"}
                    </Cell>

                    <Cell>
                      {subscription.stripeSubscriptionId ??
                        "Not connected"}
                    </Cell>

                    <Cell>
                      {subscription.currentPeriodEnd
                        ? subscription.currentPeriodEnd.toLocaleDateString(
                            "en-US",
                          )
                        : "Not available"}
                    </Cell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}
