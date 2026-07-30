import { getCurrentDatabaseUser } from "@/lib/current-user";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export type BubOpsRole =
  | "PLATFORM_ADMIN"
  | "OWNER"
  | "MANAGER"
  | "DRIVER";

export async function getCurrentAccess() {
  const user = await getCurrentDatabaseUser();

  if (!user) {
    return null;
  }

  const { workspace, role } =
    await getOrCreateDefaultWorkspace(user);

  return {
    user,
    workspace,
    role: role as BubOpsRole,
  };
}

export async function requireRole(
  allowedRoles: BubOpsRole[],
) {
  const access = await getCurrentAccess();

  if (!access) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!allowedRoles.includes(access.role)) {
    throw new Error("FORBIDDEN");
  }

  return access;
}