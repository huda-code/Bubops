import AppShell from "@/components/app-shell";
import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PlatformDriversPage() {
  const access = await getCurrentAccess();

  if (!access) {
    redirect("/auth/login");
  }

  if (access.role !== "PLATFORM_ADMIN") {
    redirect("/");
  }

  const drivers = await prisma.driverProfile.findMany({
    include: {
      user: true,
      workspace: true,
      assignedOrders: {
        select: {
          id: true,
          status: true,
        },
      },
      deliveryTasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const available = drivers.filter(
    (driver) => driver.status === "AVAILABLE",
  ).length;

  const busy = drivers.filter(
    (driver) => driver.status === "BUSY",
  ).length;

  const offDuty = drivers.filter(
    (driver) => driver.status === "OFF_DUTY",
  ).length;

  return (
    <AppShell
      email={access.user.email}
      role={access.role}
      plan="platform"
      title="Platform Drivers"
      description="Monitor drivers, tenant assignments, vehicles, and delivery workload."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total drivers"
          value={drivers.length}
          detail="Registered driver profiles"
        />

        <MetricCard
          label="Available"
          value={available}
          detail="Ready for assignment"
        />

        <MetricCard
          label="Busy"
          value={busy}
          detail="Currently working"
        />

        <MetricCard
          label="Off duty"
          value={offDuty}
          detail="Unavailable drivers"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">
            Driver directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Drivers across all BubOps tenants
          </p>
        </div>

        {drivers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No driver profiles exist yet.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              The Auth0 driver account exists, but it still needs a
              DriverProfile record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>Driver</TableHeading>
                  <TableHeading>Tenant</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Vehicle</TableHeading>
                  <TableHeading>License</TableHeading>
                  <TableHeading>Service area</TableHeading>
                  <TableHeading>Orders</TableHeading>
                  <TableHeading>Tasks</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {drivers.map((driver) => {
                  const activeTasks = driver.deliveryTasks.filter(
                    (task) =>
                      task.status === "SCHEDULED" ||
                      task.status === "IN_PROGRESS",
                  ).length;

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50">
                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {driver.user.name ?? driver.user.email}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {driver.user.email}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {driver.workspace.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {driver.workspace.slug}
                        </p>
                      </TableCell>

                      <TableCell>
                        <StatusBadge value={driver.status} />
                      </TableCell>

                      <TableCell>
                        {driver.vehicleName ?? "Not assigned"}
                        {driver.vehicleNumber
                          ? ` · ${driver.vehicleNumber}`
                          : ""}
                      </TableCell>

                      <TableCell>
                        {driver.licenseNumber ?? "Not provided"}
                      </TableCell>

                      <TableCell>
                        {driver.serviceArea ?? "Not assigned"}
                      </TableCell>

                      <TableCell>
                        {driver.assignedOrders.length}
                      </TableCell>

                      <TableCell>{activeTasks}</TableCell>
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
