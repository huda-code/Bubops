"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryDate: string | null;
  deliveryAddress: string | null;
  totalCents: number;
  customer: {
    fullName: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
  items: Array<{
    serviceName: string;
  }>;
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
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAddress(order: Order) {
  if (order.deliveryAddress) {
    return order.deliveryAddress;
  }

  const customerAddress = [
    order.customer.address,
    order.customer.city,
    order.customer.state,
    order.customer.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return customerAddress || "Address not provided";
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
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
        throw new Error("Unable to load delivery information");
      }

      const meData = await meResponse.json();
      const ordersData = await ordersResponse.json();

      setMe(meData);
      setOrders(ordersData.orders ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load delivery information",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const deliveryOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === "ALL") {
        return order.status !== "CANCELLED";
      }

      return order.status === filter;
    });
  }, [orders, filter]);

  const scheduledCount = orders.filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "PROCESSING" ||
      order.status === "READY",
  ).length;

  const activeCount = orders.filter(
    (order) => order.status === "OUT_FOR_DELIVERY",
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "DELIVERED",
  ).length;

  return (
    <AppShell
      email={me?.user?.email ?? "BubOps user"}
      role={me?.workspace?.role ?? "OWNER"}
      plan={me?.workspace?.plan ?? "free"}
      title="Delivery Management"
      description="Track pickups, scheduled deliveries, and completed orders"
    >
      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Scheduled"
          value={scheduledCount}
          description="Orders preparing for delivery"
          icon={CalendarDays}
          iconClass="bg-blue-100 text-blue-700"
        />

        <MetricCard
          label="Out for delivery"
          value={activeCount}
          description="Currently with drivers"
          icon={Truck}
          iconClass="bg-violet-100 text-violet-700"
        />

        <MetricCard
          label="Completed"
          value={completedCount}
          description="Successfully delivered"
          icon={CheckCircle2}
          iconClass="bg-emerald-100 text-emerald-700"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Delivery Queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              View delivery-ready and active laundry orders
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
            >
              <option value="ALL">All deliveries</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY">Ready</option>
              <option value="OUT_FOR_DELIVERY">
                Out for delivery
              </option>
              <option value="DELIVERED">Delivered</option>
            </select>

            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm lg:col-span-2">
            Loading deliveries...
          </div>
        ) : deliveryOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm lg:col-span-2">
            <PackageCheck className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-semibold">
              No matching deliveries
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Change the filter or create another order.
            </p>
          </div>
        ) : (
          deliveryOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-violet-600">
                    {order.orderNumber}
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    {order.customer.fullName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {order.items
                      .map((item) => item.serviceName)
                      .join(", ")}
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4">
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <span>{getAddress(order)}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Phone className="h-4 w-4 text-violet-600" />
                  <span>
                    {order.customer.phone ?? "No phone provided"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Clock3 className="h-4 w-4 text-violet-600" />
                  <span>
                    Delivery: {formatDate(order.deliveryDate)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-lg font-bold">
                  {formatMoney(order.totalCents)}
                </p>

                <button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  View delivery
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Truck;
  iconClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-4xl font-bold">{value}</p>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </article>
  );
}