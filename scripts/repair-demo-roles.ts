import prisma from "../src/lib/prisma";

const emails = {
  admin: "code.huda+admin@gmail.com",
  owner: "code.huda+owner@gmail.com",
  manager: "code.huda+manager@gmail.com",
  driver: "code.huda+driver@gmail.com",
};

async function main() {
  const [admin, owner, manager, driver] = await Promise.all([
    prisma.user.findFirst({
      where: {
        email: {
          equals: emails.admin,
          mode: "insensitive",
        },
      },
      include: {
        memberships: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),

    prisma.user.findFirst({
      where: {
        email: {
          equals: emails.owner,
          mode: "insensitive",
        },
      },
      include: {
        memberships: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),

    prisma.user.findFirst({
      where: {
        email: {
          equals: emails.manager,
          mode: "insensitive",
        },
      },
      include: {
        memberships: true,
      },
    }),

    prisma.user.findFirst({
      where: {
        email: {
          equals: emails.driver,
          mode: "insensitive",
        },
      },
      include: {
        memberships: true,
      },
    }),
  ]);

  if (!admin || !owner || !manager || !driver) {
    throw new Error(
      "One or more demo users are missing. Log in with all four Auth0 accounts first.",
    );
  }

  const ownerMembership = owner.memberships[0];
  const adminMembership = admin.memberships[0];

  if (!ownerMembership) {
    throw new Error("Owner has no workspace membership.");
  }

  if (!adminMembership) {
    throw new Error("Admin has no workspace membership.");
  }

  await prisma.$transaction([
    // Owner remains owner of the laundry workspace.
    prisma.membership.update({
      where: {
        id: ownerMembership.id,
      },
      data: {
        role: "OWNER",
      },
    }),

    // Admin becomes platform administrator.
    prisma.membership.update({
      where: {
        id: adminMembership.id,
      },
      data: {
        role: "PLATFORM_ADMIN",
      },
    }),

    // Remove the incorrect standalone owner memberships.
    prisma.membership.deleteMany({
      where: {
        userId: manager.id,
      },
    }),

    prisma.membership.deleteMany({
      where: {
        userId: driver.id,
      },
    }),
  ]);

  await prisma.membership.create({
    data: {
      userId: manager.id,
      workspaceId: ownerMembership.workspaceId,
      role: "MANAGER",
    },
  });

  await prisma.membership.create({
    data: {
      userId: driver.id,
      workspaceId: ownerMembership.workspaceId,
      role: "DRIVER",
    },
  });

  console.log("Demo roles repaired successfully.");
  console.log({
    owner: {
      email: owner.email,
      role: "OWNER",
      workspaceId: ownerMembership.workspaceId,
    },
    manager: {
      email: manager.email,
      role: "MANAGER",
      workspaceId: ownerMembership.workspaceId,
    },
    driver: {
      email: driver.email,
      role: "DRIVER",
      workspaceId: ownerMembership.workspaceId,
    },
    admin: {
      email: admin.email,
      role: "PLATFORM_ADMIN",
      workspaceId: adminMembership.workspaceId,
    },
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