import EmployeesPage from "@/components/employees-page";
import { getCurrentAccess } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function EmployeesRoute() {
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

  return <EmployeesPage />;
}
