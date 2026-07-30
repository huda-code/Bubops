import BubOpsDashboard from "@/components/bubops-dashboard";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 px-6 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white">
            B
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Welcome to BubOps
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to your laundry management workspace
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <a
              href="/auth/login"
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Sign in with Auth0
            </a>

            <a
              href="/auth/login?screen_hint=signup"
              className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Create a business account
            </a>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Secure access
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Authentication is handled by Auth0. Only verified email
              accounts can access BubOps.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (session.user.email_verified !== true) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 px-6 py-12">
        <section className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
            !
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-950">
            Verify your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please verify your email address before accessing BubOps.
            Check your inbox for the verification message from Auth0.
          </p>

          <div className="mt-7 space-y-3">
            <a
              href="/auth/logout"
              className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Log out
            </a>

            <a
              href="/"
              className="flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Check again
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