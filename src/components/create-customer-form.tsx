"use client";

import { FormEvent, useState } from "react";

type CreateCustomerFormProps = {
  onCreated: () => void;
};

export default function CreateCustomerForm({
  onCreated,
}: CreateCustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email: email || undefined,
          phone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create customer");
      }

      setFullName("");
      setEmail("");
      setPhone("");
      setMessage(`${data.fullName} added`);
      onCreated();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create customer",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <p className="text-sm font-medium text-cyan-400">
        Customers
      </p>

      <h2 className="mt-1 text-xl font-semibold">
        Add customer
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        <label className="text-sm text-zinc-400">
          Full name
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
        </label>

        <label className="text-sm text-zinc-400">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
        </label>

        <label className="text-sm text-zinc-400">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
        </label>

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add customer"}
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