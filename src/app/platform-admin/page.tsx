import AppShell from "@/components/app-shell";
import { setTenantStatus } from "@/app/platform-admin/actions";
import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PlatformAdminPage() {
  const access = await getCurrentAccess();

  if (!access) {
    redirect("/auth/login");
  }

  if (access.role !== "PLATFORM_ADMIN") {
    redirect("/");
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      memberships: {
        some: {
          role: "OWNER",
        },
      },
    },
    include: {
      subscription: true,
      memberships: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          customers: true,
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeTenants = workspaces.filter(
    (workspace) => workspace.status === "ACTIVE",
  ).length;

  const trialTenants = workspaces.filter(
    (workspace) => workspace.status === "TRIAL",
  ).length;

  const suspendedTenants = workspaces.filter(
    (workspace) => workspace.status === "SUSPENDED",
  ).length;

  const totalOrders = workspaces.reduce(
    (total, workspace) => total + workspace._count.orders,
    0,
  );

  return (
    <AppShell
      email={access.user.email}
      role={access.role}
      plan="platform"
      title="Platform Administration"
      description="Manage BubOps tenants, subscriptions, usage, and platform access."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total tenants"
          value={workspaces.length}
          detail="Laundry businesses"
        />

        <MetricCard
          label="Active tenants"
          value={activeTenants}
          detail={`${trialTenants} currently in trial`}
        />

        <MetricCard
          label="Suspended"
          value={suspendedTenants}
          detail="Restricted businesses"
        />

        <MetricCard
          label="Platform orders"
          value={totalOrders}
          detail="Across all tenants"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">
            Tenant management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Every laundry business and its current BubOps plan.
          </p>
        </div>

        {workspaces.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No laundry tenants have been created.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>Business</TableHeading>
                  <TableHeading>Owner</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Plan</TableHeading>
                  <TableHeading>Customers</TableHeading>
                  <TableHeading>Orders</TableHeading>
                  <TableHeading>Usage</TableHeading>
                  <TableHeading>Actions</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {workspaces.map((workspace) => {
                  const owner = workspace.memberships.find(
                    (membership) => membership.role === "OWNER",
                  );

                  const subscription = workspace.subscription;

                  return (
                    <tr key={workspace.id} className="hover:bg-slate-50">
                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {workspace.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {workspace.slug}
                        </p>
                      </TableCell>

                      <TableCell>
                        {owner?.user.email ?? workspace.businessEmail}
                      </TableCell>

                      <TableCell>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                          {workspace.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        {subscription?.plan ?? "free"}
                      </TableCell>

                      <TableCell>{workspace._count.customers}</TableCell>

                      <TableCell>{workspace._count.orders}</TableCell>

                      <TableCell>
                        {subscription
                          ? `${subscription.monthlyOrdersUsed}/${subscription.orderLimit}`
                          : "0/0"}
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          {workspace.status !== "ACTIVE" ? (
                            <form
                              action={setTenantStatus.bind(
                                null,
                                workspace.id,
                                "ACTIVE",
                              )}
                            >
                              <button
                                type="submit"
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            </form>
                          ) : null}

                          {workspace.status !== "SUSPENDED" ? (
                            <form
                              action={setTenantStatus.bind(
                                null,
                                workspace.id,
                                "SUSPENDED",
                              )}
                            >
                              <button
                                type="submit"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Suspend
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
  value: number;
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

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}
