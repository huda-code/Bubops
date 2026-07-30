import prisma from "../src/lib/prisma";

const DRIVER_EMAIL = "code.huda+driver@gmail.com";

async function main() {
  const driverUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: DRIVER_EMAIL,
        mode: "insensitive",
      },
    },
    include: {
      memberships: {
        where: {
          role: "DRIVER",
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
      driverProfile: true,
    },
  });

  if (!driverUser) {
    throw new Error("Driver user not found.");
  }

  const membership = driverUser.memberships[0];

  if (!membership) {
    throw new Error("Driver membership not found.");
  }

  const profile = await prisma.driverProfile.upsert({
    where: {
      userId: driverUser.id,
    },
    update: {
      workspaceId: membership.workspaceId,
      status: "AVAILABLE",
      vehicleName: "BubOps Delivery Van",
      vehicleNumber: "VAN-101",
      licenseNumber: "DEMO-DL-2026",
      serviceArea: "Chicago Metro",
    },
    create: {
      userId: driverUser.id,
      workspaceId: membership.workspaceId,
      status: "AVAILABLE",
      vehicleName: "BubOps Delivery Van",
      vehicleNumber: "VAN-101",
      licenseNumber: "DEMO-DL-2026",
      serviceArea: "Chicago Metro",
    },
  });

  console.log("Driver profile ready:");
  console.log(profile);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });