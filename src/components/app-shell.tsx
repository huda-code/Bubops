"use client";

import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shirt,
  Truck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

type AppShellProps = {
  children: ReactNode;
  email: string;
  role: string;
  plan: string;
  title: string;
  description: string;
};

const ownerLinks = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Orders", icon: Shirt, href: "/orders" },
  { label: "Customers", icon: UsersRound, href: "/customers" },
  { label: "Delivery", icon: Truck, href: "/delivery" },
  { label: "Employees", icon: UserRound, href: "/employees" },
  { label: "Billing", icon: CreditCard, href: "/billing" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const driverLinks = [
  { label: "Driver Portal", icon: Truck, href: "/driver" },
  { label: "Delivery", icon: CalendarDays, href: "/delivery" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function AppShell({
  children,
  email,
  role,
  plan,
  title,
  description,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const links = role === "DRIVER" ? driverLinks : ownerLinks;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-5 top-5 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px]"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[310px] flex-col bg-gradient-to-b from-blue-600 via-violet-600 to-purple-700 text-white shadow-2xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/20 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <span className="text-xl font-black">B</span>
            </div>

            <div>
              <p className="text-xl font-bold">BubOps</p>
              <p className="text-xs text-white/70">
                Laundry operating system
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-white/20 shadow-sm"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {link.label}
                </span>

                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/20 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {email}
              </p>
              <p className="text-xs capitalize text-white/70">
                {role.toLowerCase()} · {plan} plan
              </p>
            </div>
          </div>

          <a
            href="/auth/logout"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </a>
        </div>
      </aside>

      <div className="mx-auto max-w-7xl px-6 pb-12 pt-20">
        <section className="rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-violet-700 px-8 py-8 text-white shadow-lg">
          <p className="text-sm font-medium text-white/75">
            BubOps Laundry Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>

          <p className="mt-2 text-base text-white/80">
            {description}
          </p>
        </section>

        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}