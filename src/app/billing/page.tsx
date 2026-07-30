import BillingPage from "@/components/billing-page";
import { getCurrentAccess } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function BillingRoute() {
  const access = await getCurrentAccess();

  if (!access) {
    redirect("/auth/login");
  }

  if (
    access.role !== "OWNER" &&
    access.role !== "PLATFORM_ADMIN"
  ) {
    redirect("/");
  }

  return <BillingPage />;
}
