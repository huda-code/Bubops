"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { createTenant } from "./create-tenant-action";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
    >
      {pending ? "Creating..." : "Create Tenant"}
    </button>
  );
}

export function CreateTenantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 shadow"
      >
        <Plus size={18} />
        Create Tenant
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Tenant
                </h2>
                <p className="text-sm text-slate-500">
                  Add a laundry business to BubOps.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form action={createTenant} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Business name
                </label>
                <input
                  name="businessName"
                  required
                  placeholder="Fresh Laundry Chicago"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Owner email
                </label>
                <input
                  name="ownerEmail"
                  type="email"
                  required
                  placeholder="owner@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                <p className="mt-1 text-xs text-slate-500">
                  The owner must have logged into BubOps once.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  name="plan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="free">Free — 25 orders</option>
                  <option value="pro">Pro trial — 1,000 orders</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  Cancel
                </button>

                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
