"use server";

import { getCurrentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDeliveryTaskStatus(
  taskId: string,
  status: "IN_PROGRESS" | "COMPLETED",
) {
  const access = await getCurrentAccess();

  if (!access || access.role !== "DRIVER") {
    throw new Error("FORBIDDEN");
  }

  const driver = await prisma.driverProfile.findUnique({
    where: {
      userId: access.user.id,
    },
  });

  if (!driver) {
    throw new Error("DRIVER_PROFILE_NOT_FOUND");
  }

  const task = await prisma.deliveryTask.findFirst({
    where: {
      id: taskId,
      driverId: driver.id,
    },
  });

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  await prisma.deliveryTask.update({
    where: {
      id: task.id,
    },
    data: {
      status,
      startedAt:
        status === "IN_PROGRESS"
          ? new Date()
          : task.startedAt,
      completedAt:
        status === "COMPLETED"
          ? new Date()
          : null,
    },
  });

  await prisma.driverProfile.update({
    where: {
      id: driver.id,
    },
    data: {
      status:
        status === "COMPLETED"
          ? "AVAILABLE"
          : "BUSY",
    },
  });

  revalidatePath("/driver");
  revalidatePath("/platform-admin/drivers");
  revalidatePath("/platform-admin/orders");
}
