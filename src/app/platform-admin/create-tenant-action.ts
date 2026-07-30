"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentAccess } from "@/lib/authorization";

export async function createTenant(formData: FormData) {
  const access = await getCurrentAccess();

  if (!access || access.role !== "PLATFORM_ADMIN") {
    throw new Error("Only platform administrators can create tenants.");
  }

  const businessName = String(formData.get("businessName") || "").trim();
  const ownerEmail = String(formData.get("ownerEmail") || "")
    .trim()
    .toLowerCase();
  const plan = String(formData.get("plan") || "free");

  if (!businessName || !ownerEmail) {
    throw new Error("Business name and owner email are required.");
  }

  if (plan !== "free" && plan !== "pro") {
    throw new Error("Invalid subscription plan.");
  }

  const owner = await prisma.user.findFirst({
    where: {
      email: {
        equals: ownerEmail,
        mode: "insensitive",
      },
    },
  });

  if (!owner) {
    throw new Error(
      "The owner must log in to BubOps once before you create their tenant.",
    );
  }

  const existingOwnerMembership = await prisma.membership.findFirst({
    where: {
      userId: owner.id,
      role: "OWNER",
    },
  });

  if (existingOwnerMembership) {
    throw new Error("This owner already has a tenant.");
  }

  const baseSlug =
    businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tenant";

  const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
  const isPro = plan === "pro";

  await prisma.workspace.create({
    data: {
      name: businessName,
      slug,
      businessEmail: ownerEmail,
      status: "TRIAL",

      memberships: {
        create: {
          userId: owner.id,
          role: "OWNER",
        },
      },

      subscription: {
        create: {
          plan: isPro ? "pro" : "free",
          status: isPro ? "TRIALING" : "FREE",
          orderLimit: isPro ? 1000 : 25,
          monthlyOrdersUsed: 0,
        },
      },

      auditLogs: {
        create: {
          userId: access.user.id,
          action: "TENANT_CREATED",
          resourceType: "Workspace",
          newValues: {
            businessName,
            ownerEmail,
            plan,
          },
        },
      },
    },
  });

  revalidatePath("/platform-admin");
}