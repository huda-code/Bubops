"use client";

import { Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import CreateCustomerForm from "@/components/create-customer-form";

type Customer = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpentCents: number;
  isActive: boolean;
  createdAt: string;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [meResponse, customersResponse] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/customers"),
      ]);

      if (!meResponse.ok || !customersResponse.ok) {
        throw new Error("Unable to load customers");
      }

      const meData = await meResponse.json();
      const customersData = await customersResponse.json();

      setMe(meData);
      setCustomers(customersData.customers ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.email ?? "",
        customer.phone ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [customers, search]);

  return (
    <AppShell
      email={me?.user?.email ?? "BubOps user"}
      role={me?.workspace?.role ?? "OWNER"}
      plan={me?.workspace?.plan ?? "free"}
      title="Customer Management"
      description="View and manage your laundry customers"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Customers</h2>
            <p className="mt-1 text-sm text-slate-500">
              {customers.length} customer records in this workspace
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            {showForm ? "Close form" : "Add customer"}
          </button>
        </div>

        <label className="relative mt-6 block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
      </section>

      {showForm ? (
        <CreateCustomerForm
          onCreated={() => {
            void loadData();
            setShowForm(false);
          }}
        />
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">No matching customers</p>
            <p className="mt-1 text-sm text-slate-500">
              Add a customer or change your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Orders</th>
                  <th className="px-6 py-4 font-semibold">Spent</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {customer.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ID: {customer.id.slice(-8)}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      <p>{customer.email ?? "No email"}</p>
                      <p className="mt-1">
                        {customer.phone ?? "No phone"}
                      </p>
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      {customer.totalOrders}
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      {formatMoney(customer.totalSpentCents)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDate(customer.createdAt)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          customer.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}