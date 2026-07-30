import prisma from "@/lib/prisma";

type DatabaseUser = {
  id: string;
  auth0Id: string;
  email: string;
  name: string | null;
};

function createSlug(email: string) {
  const base =
    email
      .split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "laundry";

  const randomSuffix = crypto.randomUUID().slice(0, 8);

  return `${base}-${randomSuffix}`;
}

export async function getOrCreateDefaultWorkspace(
  user: DatabaseUser,
) {
  const existingMembership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      workspace: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingMembership) {
    return {
      workspace: existingMembership.workspace,
      role: existingMembership.role,
    };
  }

  const workspaceName =
    user.name && user.name !== user.email
      ? `${user.name}'s Laundry`
      : "My BubOps Laundry";

  const workspace = await prisma.workspace.create({
    data: {
      name: workspaceName,
      slug: createSlug(user.email),
      status: "TRIAL",
      businessEmail: user.email,

      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },

      subscription: {
        create: {
          plan: "free",
          status: "FREE",
          orderLimit: 25,
          monthlyOrdersUsed: 0,
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  return {
    workspace,
    role: "OWNER" as const,
  };
}