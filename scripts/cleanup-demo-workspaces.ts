import prisma from "../src/lib/prisma";

const KEEP_WORKSPACE_IDS = [
  // Actual laundry-owner workspace
  "cms81v4kt0003pl0qdhzwbngl",

  // BubOps platform-admin workspace
  "cms820ih60005si0qxh3p4g5c",
];

const DEMO_EMAILS = [
  "code.huda+admin@gmail.com",
  "code.huda+owner@gmail.com",
  "code.huda+manager@gmail.com",
  "code.huda+driver@gmail.com",
];

async function main() {
  const duplicateWorkspaces = await prisma.workspace.findMany({
    where: {
      id: {
        notIn: KEEP_WORKSPACE_IDS,
      },
      memberships: {
        some: {
          user: {
            email: {
              in: DEMO_EMAILS,
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      memberships: {
        select: {
          role: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  console.log("Deleting duplicate demo workspaces:");
  console.dir(duplicateWorkspaces, { depth: null });

  const result = await prisma.workspace.deleteMany({
    where: {
      id: {
        in: duplicateWorkspaces.map((workspace) => workspace.id),
      },
    },
  });

  console.log(`Deleted ${result.count} duplicate workspaces.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });