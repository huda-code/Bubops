"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import AppShell from "@/components/app-shell";

type OrderItem = {
  id: string;
  serviceName: string;
  quantity: number;
  unit: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  paymentStatus: string;
  totalCents: number;
  pickupDate: string | null;
  deliveryDate: string | null;
  createdAt: string;
  customer: {
    fullName: string;
  };
  items: OrderItem[];
};

type MeResponse = {
  user?: {
    email?: string;
  };
  workspace?: {
    role?: string;
    plan?: string;
  };
};

const statusSteps = [
  "PENDING",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

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

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusIndex(status: string) {
  const index = statusSteps.indexOf(status);
  return index < 0 ? 0 : index;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [meResponse, ordersResponse] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/orders"),
      ]);

      if (!meResponse.ok || !ordersResponse.ok) {
        throw new Error("Unable to load orders");
      }

      const meData = await meResponse.json();
      const ordersData = await ordersResponse.json();

      setMe(meData);
      setOrders(ordersData.orders ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        status === "ALL" || order.status === status;

      const searchableText = [
        order.orderNumber,
        order.customer.fullName,
        order.status,
        order.paymentStatus,
        ...order.items.map((item) => item.serviceName),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, status]);

  return (
    <AppShell
      email={me?.user?.email ?? "BubOps user"}
      role={me?.workspace?.role ?? "OWNER"}
      plan={me?.workspace?.plan ?? "free"}
      title="Order Management"
      description="Manage and track all laundry orders"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold">Filter Orders</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by order, customer, service, or status
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_240px]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders, customers, or services..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY">Ready</option>
            <option value="OUT_FOR_DELIVERY">
              Out for Delivery
            </option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <p className="mt-5 text-sm text-slate-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </section>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 space-y-5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold">No matching orders</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const currentStep = statusIndex(order.status);
            const progress =
              order.status === "CANCELLED"
                ? 0
                : Math.round(
                    ((currentStep + 1) / statusSteps.length) * 100,
                  );

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold">
                        {order.orderNumber}
                      </h3>

                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        {formatStatus(order.priority)}
                      </span>
                    </div>

                    <p className="mt-2 font-medium text-slate-700">
                      {order.customer.fullName}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {order.items
                        .map((item) => item.serviceName)
                        .join(", ")}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Created: {formatDate(order.createdAt)} · Delivery:{" "}
                      {formatDate(order.deliveryDate)}
                    </p>

                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {formatStatus(order.paymentStatus)}
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xl font-bold">
                      {formatMoney(order.totalCents)}
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="font-semibold">
                      Status Progress
                    </span>
                    <span>{progress}%</span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 right-3 top-2.5 h-1 rounded-full bg-slate-200" />

                    <div
                      className="absolute left-3 top-2.5 h-1 rounded-full bg-violet-500 transition-all"
                      style={{
                        width: `calc(${progress}% - 24px)`,
                      }}
                    />

                    <div className="relative flex justify-between">
                      {statusSteps.map((step, index) => {
                        const completed = index <= currentStep;

                        return (
                          <div
                            key={step}
                            className="flex flex-col items-center"
                          >
                            <div
                              className={`h-6 w-6 rounded-full border-4 ${
                                completed
                                  ? "border-violet-200 bg-violet-600"
                                  : "border-slate-200 bg-white"
                              }`}
                            />

                            <span className="mt-2 text-center text-xs text-slate-500">
                              {formatStatus(step)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </AppShell>
  );
}