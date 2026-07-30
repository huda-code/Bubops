"use server";

import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setTenantStatus(
  workspaceId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  const access = await getCurrentAccess();

  if (!access || access.role !== "PLATFORM_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  await prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      status,
    },
  });

  revalidatePath("/platform-admin");
}
