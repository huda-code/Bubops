import OrdersPage from "@/components/orders-page";
import { getCurrentAccess } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function OrdersRoute() {
  const access = await getCurrentAccess();

  if (!access) redirect("/auth/login");

  if (
    access.role !== "OWNER" &&
    access.role !== "MANAGER"
  ) {
    redirect("/");
  }

  return <OrdersPage />;
}
