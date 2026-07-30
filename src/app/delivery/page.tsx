import DeliveryPage from "@/components/delivery-page";
import { getCurrentAccess } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function DeliveryRoute() {
  const access = await getCurrentAccess();

  if (!access) redirect("/auth/login");

  if (
    access.role !== "OWNER" &&
    access.role !== "MANAGER"
  ) {
    redirect("/");
  }

  return <DeliveryPage />;
}
