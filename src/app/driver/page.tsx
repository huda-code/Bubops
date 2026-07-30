import AppShell from "@/components/app-shell";
import { updateDeliveryTaskStatus } from "@/app/driver/actions";
import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DriverPortalPage() {
  const access = await getCurrentAccess();

  if (!access) {
    redirect("/auth/login");
  }

  if (access.role !== "DRIVER") {
    redirect("/");
  }

  const driver = await prisma.driverProfile.findUnique({
    where: {
      userId: access.user.id,
    },
    include: {
      deliveryTasks: {
        include: {
          order: {
            select: {
              orderNumber: true,
              totalCents: true,
            },
          },
        },
        orderBy: [
          {
            scheduledAt: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });

  if (!driver) {
    return (
      <AppShell
        email={access.user.email}
        role={access.role}
        plan="driver"
        title="Driver Portal"
        description="View and complete your assigned BubOps delivery tasks."
      >
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-xl font-bold text-amber-950">
            Driver profile pending
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            The platform administrator must finish creating your driver
            profile before tasks can be assigned.
          </p>
        </section>
      </AppShell>
    );
  }

  const completed = driver.deliveryTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const inProgress = driver.deliveryTasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const pending = driver.deliveryTasks.filter(
    (task) => task.status === "SCHEDULED",
  ).length;

  return (
    <AppShell
      email={access.user.email}
      role={access.role}
      plan="driver"
      title="Driver Portal"
      description="View your vehicle, status, and assigned pickup and delivery tasks."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Driver status"
          value={driver.status.replaceAll("_", " ")}
          detail={driver.serviceArea ?? "No service area"}
        />

        <MetricCard
          label="Pending"
          value={String(pending)}
          detail="Scheduled tasks"
        />

        <MetricCard
          label="In progress"
          value={String(inProgress)}
          detail="Active tasks"
        />

        <MetricCard
          label="Completed"
          value={String(completed)}
          detail="Finished tasks"
        />
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Vehicle information
        </h2>

        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <Info label="Vehicle" value={driver.vehicleName ?? "Not assigned"} />
          <Info
            label="Vehicle number"
            value={driver.vehicleNumber ?? "Not assigned"}
          />
          <Info
            label="License"
            value={driver.licenseNumber ?? "Not provided"}
          />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-950">
            Assigned tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Only tasks assigned to your driver profile appear here.
          </p>
        </div>

        {driver.deliveryTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            No delivery tasks have been assigned yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {driver.deliveryTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">
                        {task.order.orderNumber}
                      </p>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {task.taskType}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-4 font-semibold text-slate-900">
                      {task.customerName}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {task.customerAddress}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {task.customerPhone ?? "No phone provided"}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>
                      {task.scheduledAt
                        ? task.scheduledAt.toLocaleString("en-US")
                        : "Schedule pending"}
                    </p>

                    <p className="mt-1">
                      {task.timeSlot ?? "No time slot"}
                    </p>

                    <p className="mt-3 font-semibold text-slate-950">
                      ${(task.order.totalCents / 100).toFixed(2)}
                    </p>

                    <div className="mt-4 flex gap-2">
                      {task.status === "SCHEDULED" ? (
                        <form
                          action={updateDeliveryTaskStatus.bind(
                            null,
                            task.id,
                            "IN_PROGRESS",
                          )}
                        >
                          <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Start task
                          </button>
                        </form>
                      ) : null}

                      {task.status === "IN_PROGRESS" ? (
                        <form
                          action={updateDeliveryTaskStatus.bind(
                            null,
                            task.id,
                            "COMPLETED",
                          )}
                        >
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Mark complete
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
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
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-medium text-slate-950">{value}</p>
    </div>
  );
}
