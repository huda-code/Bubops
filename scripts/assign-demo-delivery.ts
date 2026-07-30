import prisma from "../src/lib/prisma";

const DRIVER_EMAIL = "code.huda+driver@gmail.com";

async function main() {
  const driver = await prisma.driverProfile.findFirst({
    where: {
      user: {
        email: {
          equals: DRIVER_EMAIL,
          mode: "insensitive",
        },
      },
    },
    include: {
      user: true,
    },
  });

  if (!driver) {
    throw new Error("Demo driver profile was not found.");
  }

  const order = await prisma.laundryOrder.findFirst({
    where: {
      workspaceId: driver.workspaceId,
    },
    include: {
      customer: true,
      deliveryTasks: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!order) {
    throw new Error(
      "No order exists in the driver's laundry workspace. Create an order first.",
    );
  }

  await prisma.laundryOrder.update({
    where: {
      id: order.id,
    },
    data: {
      assignedDriverId: driver.id,
    },
  });

  const existingTask = order.deliveryTasks.find(
    (task) =>
      task.driverId === driver.id &&
      task.taskType === "DELIVERY",
  );

  if (!existingTask) {
    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + 2);

    await prisma.deliveryTask.create({
      data: {
        workspaceId: order.workspaceId,
        orderId: order.id,
        driverId: driver.id,
        taskType: "DELIVERY",
        status: "SCHEDULED",
        scheduledAt,
        customerName: order.customer.fullName,
        customerAddress:
          order.deliveryAddress ??
          order.pickupAddress ??
          "Customer address pending",
        timeSlot: "4:00 PM - 6:00 PM",
        notes: "Demo delivery assigned by BubOps Platform Admin",
      },
    });
  }

  console.log("Delivery assigned successfully:");
  console.log({
    orderNumber: order.orderNumber,
    driver: driver.user.email,
    workspaceId: driver.workspaceId,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });