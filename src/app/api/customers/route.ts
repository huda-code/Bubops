import { NextRequest, NextResponse } from "next/server";
import { getCurrentDatabaseUser } from "@/lib/current-user";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import prisma from "@/lib/prisma";

type CreateCustomerBody = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zipCode?: unknown;
  preferredService?: unknown;
  notes?: unknown;
};

const allowedServices = [
  "WASH_AND_FOLD",
  "DRY_CLEAN",
  "PRESS_ONLY",
  "PREMIUM_CLEAN",
  "EXPRESS_SERVICE",
] as const;

type ServiceType = (typeof allowedServices)[number];

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned || null;
}

export async function GET() {
  try {
    const user = await getCurrentDatabaseUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { workspace } =
      await getOrCreateDefaultWorkspace(user);

    const customers = await prisma.customer.findMany({
      where: {
        workspaceId: workspace.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Failed to load customers:", error);

    return NextResponse.json(
      { error: "Unable to load customers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentDatabaseUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { workspace, role } =
      await getOrCreateDefaultWorkspace(user);

    if (
      role !== "OWNER" &&
      role !== "EMPLOYEE" &&
      role !== "PLATFORM_ADMIN"
    ) {
      return NextResponse.json(
        { error: "You do not have permission to add customers" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateCustomerBody;

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const email = optionalText(body.email)?.toLowerCase() ?? null;
    const phone = optionalText(body.phone);
    const address = optionalText(body.address);
    const city = optionalText(body.city);
    const state = optionalText(body.state);
    const zipCode = optionalText(body.zipCode);
    const notes = optionalText(body.notes);

    const preferredServiceValue =
      typeof body.preferredService === "string"
        ? body.preferredService
        : null;

    const preferredService =
      preferredServiceValue &&
      allowedServices.includes(
        preferredServiceValue as ServiceType,
      )
        ? (preferredServiceValue as ServiceType)
        : null;

    if (!fullName) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 },
      );
    }

    const customer = await prisma.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: {
          workspaceId: workspace.id,
          fullName,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          preferredService,
          notes,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: "customer.created",
          resourceType: "Customer",
          resourceId: createdCustomer.id,
          newValues: {
            fullName: createdCustomer.fullName,
            email: createdCustomer.email,
            phone: createdCustomer.phone,
          },
        },
      });

      return createdCustomer;
    });

    return NextResponse.json(
      { customer },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create customer:", error);

    return NextResponse.json(
      { error: "Unable to create customer" },
      { status: 500 },
    );
  }
}