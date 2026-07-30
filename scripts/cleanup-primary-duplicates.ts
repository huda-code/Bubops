import prisma from "../src/lib/prisma";

const KEEP_WORKSPACE_IDS = [
  // Owner demo tenant
  "cms81v4kt0003pl0qdhzwbngl",

  // Pro demo tenant
  "aaileenuni-a9dcb5d5",
];

async function main() {
  const duplicates = await prisma.workspace.findMany({
    where: {
      businessEmail: {
        equals: "code.huda@gmail.com",
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessEmail: true,
      _count: {
        select: {
          customers: true,
          orders: true,
        },
      },
    },
  });

  const deletable = duplicates.filter(
    (workspace) => !KEEP_WORKSPACE_IDS.includes(workspace.id),
  );

  console.log("Deleting these duplicate workspaces:");
  console.dir(deletable, { depth: null });

  const result = await prisma.workspace.deleteMany({
    where: {
      id: {
        in: deletable.map((workspace) => workspace.id),
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