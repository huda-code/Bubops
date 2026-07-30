"use client";

import { FormEvent, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
};

type CreateOrderFormProps = {
  customers: Customer[];
  onCreated: () => void;
};

export default function CreateOrderForm({
  customers,
  onCreated,
}: CreateOrderFormProps) {
  const [customerId, setCustomerId] = useState(
    customers[0]?.id ?? "",
  );
  const [serviceName, setServiceName] = useState("Wash and Fold");
  const [serviceType, setServiceType] = useState("WASH_AND_FOLD");
  const [weight, setWeight] = useState("10");
  const [deliveryFee, setDeliveryFee] = useState("5");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          deliveryDate:
            deliveryDate ||
            new Date(Date.now() + 2 * 86400000).toISOString(),
          deliveryFeeCents: Math.round(
            Number(deliveryFee) * 100,
          ),
          items: [
            {
  serviceType,
  serviceName,
  quantity: Number(weight),
  unit: "lb",
  unitPriceCents: 175,
},
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create order");
      }
setMessage(`Order ${data.order.orderNumber} created`);
      onCreated();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create order",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div>
        <p className="text-sm font-medium text-cyan-400">
          New order
        </p>
        <h2 className="mt-1 text-xl font-semibold">
          Create laundry order
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <label className="text-sm text-zinc-400">
          Customer
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-400">
          Service
         <select
  value={serviceType}
  onChange={(event) => {
    const value = event.target.value;
    setServiceType(value);

    const names: Record<string, string> = {
      WASH_AND_FOLD: "Wash and Fold",
      DRY_CLEAN: "Dry Cleaning",
      PRESS_ONLY: "Press Only",
      PREMIUM_CLEAN: "Premium Clean",
      EXPRESS_SERVICE: "Express Service",
    };

    setServiceName(names[value] ?? "Wash and Fold");
  }}
  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
>
  <option value="WASH_AND_FOLD">Wash and Fold</option>
  <option value="DRY_CLEAN">Dry Cleaning</option>
  <option value="PRESS_ONLY">Press Only</option>
  <option value="PREMIUM_CLEAN">Premium Clean</option>
  <option value="EXPRESS_SERVICE">Express Service</option>
</select>
        </label>

        <label className="text-sm text-zinc-400">
          Weight
          <input
            type="number"
            min="1"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
        </label>

        <label className="text-sm text-zinc-400">
          Delivery fee
          <input
            type="number"
            min="0"
            step="0.01"
            value={deliveryFee}
            onChange={(event) =>
              setDeliveryFee(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
        </label>

        <label className="text-sm text-zinc-400">
          Delivery date
          <input
            type="date"
            value={deliveryDate}
            onChange={(event) =>
              setDeliveryDate(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
        </label>

        <div className="md:col-span-2 lg:col-span-5">
          <button
            type="submit"
            disabled={loading || !customerId}
            className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create order"}
          </button>

          {message ? (
            <span className="ml-4 text-sm text-zinc-300">
              {message}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}