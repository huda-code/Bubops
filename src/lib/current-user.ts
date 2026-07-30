import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";

export async function getCurrentDatabaseUser() {
  const session = await auth0.getSession();

  if (!session) {
    return null;
  }

  const auth0Id = session.user.sub;

  const email =
    typeof session.user.email === "string"
      ? session.user.email.trim().toLowerCase()
      : `${auth0Id}@bubops.local`;

  const name =
    typeof session.user.name === "string"
      ? session.user.name
      : null;

  const existingByAuth0Id = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (existingByAuth0Id) {
    return prisma.user.update({
      where: {
        id: existingByAuth0Id.id,
      },
      data: {
        email,
        name,
      },
    });
  }

  const existingByEmail = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: {
        id: existingByEmail.id,
      },
      data: {
        auth0Id,
        email,
        name,
      },
    });
  }

  return prisma.user.upsert({
  where: {
    auth0Id,
  },
  update: {
    email,
    name,
  },
  create: {
    auth0Id,
    email,
    name,
  },
});
}