"use client";

import AppShell from "@/components/app-shell";
import CreateCustomerForm from "@/components/create-customer-form";
import CreateOrderForm from "@/components/create-order-form";
import BillingButton from "@/components/billing-button";
import { useCallback, useEffect, useState } from "react";

type Workspace = {
  id: string;
  name: string;
  status: string;
  role: string;
  plan: string;
  orderLimit: number;
  monthlyOrdersUsed: number;
};

type Customer = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpentCents: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  pickupDate: string | null;
  deliveryDate: string | null;
  createdAt: string;
  customer: {
    id: string;
    fullName: string;
  };
  items: Array<{
    id: string;
    serviceName: string;
    quantity: number;
    unit: string;
  }>;
};

type DashboardData = {
  workspace: Workspace | null;
  customers: Customer[];
  orders: Order[];
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function BubOpsDashboard({
  email,
}: {
  email: string;
}) {
  const [data, setData] = useState<DashboardData>({
    workspace: null,
    customers: [],
    orders: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [meResponse, customersResponse, ordersResponse] =
        await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/customers", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
        ]);

      const [meData, customersData, ordersData] =
        await Promise.all([
          meResponse.json(),
          customersResponse.json(),
          ordersResponse.json(),
        ]);

      if (!meResponse.ok) {
        throw new Error(meData.error ?? "Unable to load workspace");
      }

      if (!customersResponse.ok) {
        throw new Error(
          customersData.error ?? "Unable to load customers",
        );
      }

      if (!ordersResponse.ok) {
        throw new Error(ordersData.error ?? "Unable to load orders");
      }

      setData({
        workspace: meData.workspace,
        customers: customersData.customers,
        orders: ordersData.orders,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeOrders = data.orders.filter(
    (order) =>
      order.status !== "DELIVERED" &&
      order.status !== "CANCELLED",
  ).length;

  const monthlyRevenue = data.orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.totalCents, 0);

  const usagePercent = data.workspace
    ? Math.min(
        100,
        Math.round(
          (data.workspace.monthlyOrdersUsed /
            data.workspace.orderLimit) *
            100,
        ),
      )
    : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-slate-950">
        <p className="text-zinc-400">Loading BubOps...</p>
      </main>
    );
  }

  return (
  <AppShell
  email={email}
  role={data.workspace?.role ?? "OWNER"}
  plan={data.workspace?.plan ?? "free"}
  title="Dashboard"
  description="Overview of your laundry business operations"
>
  <div>
       

        {error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total customers"
            value={String(data.customers.length)}
            detail="Across this laundry business"
          />

          <MetricCard
            label="Active orders"
            value={String(activeOrders)}
            detail={`${data.orders.length} total orders`}
          />

          <MetricCard
            label="Paid revenue"
            value={formatMoney(monthlyRevenue)}
            detail="From paid orders"
          />

          <MetricCard
            label="Monthly usage"
            value={`${data.workspace?.monthlyOrdersUsed ?? 0}/${
              data.workspace?.orderLimit ?? 25
            }`}
            detail={`${usagePercent}% of plan limit`}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-cyan-400">
                Plan usage
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Monthly order capacity
              </h2>
            </div>

            <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
             {data.workspace?.plan?.toLowerCase() === "pro"
  ? "ACTIVE"
  : "FREE"}
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-sm text-zinc-400">
            <span>
              {data.workspace?.monthlyOrdersUsed ?? 0} orders used
            </span>
            <span>
              {data.workspace?.orderLimit ?? 25} order limit
            </span>
          </div>
        </section>
      <CreateCustomerForm
  onCreated={() => void loadDashboard()}
/>

<CreateOrderForm
  customers={data.customers}
  onCreated={() => void loadDashboard()}
/>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-cyan-400">
                Operations
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Recent orders
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-slate-300 transition hover:border-zinc-500 hover: text-slate-950"
            >
              Refresh
            </button>
          </div>

          {data.orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-zinc-200">
                No orders yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first laundry order to begin operations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order</th>
                    <th className="px-6 py-4 font-medium">
                      Customer
                    </th>
                    <th className="px-6 py-4 font-medium">
                      Service
                    </th>
                    <th className="px-6 py-4 font-medium">
                      Delivery
                    </th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {data.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-800/70 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-950">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {order.customer.fullName}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {order.items
                          .map((item) => item.serviceName)
                          .join(", ")}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {formatDate(order.deliveryDate)}
                      </td>

                      <td className="px-6 py-5 font-medium">
                        {formatMoney(order.totalCents)}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <SummaryCard
            title="Customer overview"
            value={`${data.customers.length} customers`}
            description="Customer records are isolated to this Auth0-secured workspace."
          />

          <SummaryCard
  title="Subscription"
  value={`${data.workspace?.plan ?? "Free"} plan`}
  description={
    data.workspace?.plan?.toLowerCase() === "pro"
      ? "Your BubOps Pro subscription is active and managed through Stripe."
      : "Upgrade securely through Stripe Checkout to increase your monthly order capacity."
  }
/>
        </section>
       </div>
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
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {description}
      </p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "border-amber-800 bg-amber-950/60 text-amber-300",
    PROCESSING: "border-blue-800 bg-blue-950/60 text-blue-300",
    READY: "border-purple-800 bg-purple-950/60 text-purple-300",
    OUT_FOR_DELIVERY:
      "border-cyan-800 bg-cyan-950/60 text-cyan-300",
    DELIVERED:
      "border-emerald-800 bg-emerald-950/60 text-emerald-300",
    CANCELLED: "border-red-800 bg-red-950/60 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ??
        "border-zinc-700 bg-zinc-800 text-slate-300"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}