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
      ? session.user.email
      : `${auth0Id}@bubops.local`;

  const name =
    typeof session.user.name === "string"
      ? session.user.name
      : null;

  const user = await prisma.user.upsert({
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

  return user;
}