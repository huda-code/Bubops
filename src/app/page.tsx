import BubOpsDashboard from "@/components/bubops-dashboard";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <section className="max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            BubOps
          </p>

          <h1 className="mt-5 text-5xl font-semibold tracking-tight">
            Run your laundry business from one platform.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            Manage customers, orders, deliveries, employees, and billing
            with secure multi-tenant access.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <a
              href="/auth/login?screen_hint=signup"
              className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-zinc-950"
            >
              Create business
            </a>

            <a
              href="/auth/login"
              className="rounded-lg border border-zinc-700 px-5 py-3 font-medium"
            >
              Log in
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <BubOpsDashboard
      email={session.user.email ?? "Authenticated user"}
    />
  );
}