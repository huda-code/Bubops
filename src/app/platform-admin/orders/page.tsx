import AppShell from "@/components/app-shell";
import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PlatformOrdersPage() {
  const access = await getCurrentAccess();

  if (!access) {
    redirect("/auth/login");
  }

  if (access.role !== "PLATFORM_ADMIN") {
    redirect("/");
  }

  const orders = await prisma.laundryOrder.findMany({
    include: {
      workspace: true,
      customer: true,
      deliveryTasks: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppShell
      email={access.user.email}
      role={access.role}
      plan="platform"
      title="Platform Orders"
      description="Monitor laundry orders and delivery activity across every BubOps tenant."
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">
            All tenant orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {orders.length} total orders across the platform
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No platform orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>Order</TableHeading>
                  <TableHeading>Tenant</TableHeading>
                  <TableHeading>Customer</TableHeading>
                  <TableHeading>Amount</TableHeading>
                  <TableHeading>Order status</TableHeading>
                  <TableHeading>Delivery status</TableHeading>
                  <TableHeading>Driver</TableHeading>
                  <TableHeading>Created</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const latestDeliveryTask = order.deliveryTasks[0];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.priority} priority
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {order.workspace.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.workspace.slug}
                        </p>
                      </TableCell>

                      <TableCell>{order.customer.fullName}</TableCell>

                      <TableCell>
                        ${(order.totalCents / 100).toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge value={order.status} />
                      </TableCell>

                      <TableCell>
                        {latestDeliveryTask ? (
                          <StatusBadge value={latestDeliveryTask.status} />
                        ) : (
                          <span className="text-slate-400">
                            Not scheduled
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {order.assignedDriverId ??
                          latestDeliveryTask?.driverId ??
                          "Unassigned"}
                      </TableCell>

                      <TableCell>
                        {order.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {value.replaceAll("_", " ")}
    </span>
  );
}
