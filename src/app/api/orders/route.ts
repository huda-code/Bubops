import { NextRequest, NextResponse } from "next/server";
import { getCurrentDatabaseUser } from "@/lib/current-user";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import prisma from "@/lib/prisma";

type CreateOrderBody = {
  customerId?: unknown;
  priority?: unknown;
  paymentStatus?: unknown;
  pickupAddress?: unknown;
  deliveryAddress?: unknown;
  pickupDate?: unknown;
  deliveryDate?: unknown;
  notes?: unknown;
  deliveryFeeCents?: unknown;
  items?: unknown;
};

type OrderItemInput = {
  serviceType?: unknown;
  serviceName?: unknown;
  quantity?: unknown;
  unit?: unknown;
  unitPriceCents?: unknown;
  notes?: unknown;
};

const allowedServiceTypes = [
  "WASH_AND_FOLD",
  "DRY_CLEAN",
  "PRESS_ONLY",
  "PREMIUM_CLEAN",
  "EXPRESS_SERVICE",
] as const;

const allowedPriorities = ["LOW", "NORMAL", "HIGH"] as const;

const allowedPaymentStatuses = [
  "PENDING",
  "PAID",
  "REFUNDED",
  "FAILED",
] as const;

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned || null;
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function createOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `BUB-${timestamp}-${random}`;
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

    const orders = await prisma.laundryOrder.findMany({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        customer: true,
        items: true,
        assignedDriver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to load orders:", error);

    return NextResponse.json(
      { error: "Unable to load orders" },
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
        { error: "You do not have permission to create orders" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateOrderBody;

    const customerId =
      typeof body.customerId === "string"
        ? body.customerId.trim()
        : "";

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        workspaceId: workspace.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const rawItems = Array.isArray(body.items)
      ? (body.items as OrderItemInput[])
      : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "At least one order item is required" },
        { status: 400 },
      );
    }

    const items = rawItems.map((item, index) => {
      const serviceType =
        typeof item.serviceType === "string"
          ? item.serviceType
          : "";

      const serviceName =
        typeof item.serviceName === "string"
          ? item.serviceName.trim()
          : "";

      const quantity = Number(item.quantity);
      const unitPriceCents = Number(item.unitPriceCents);
      const unit =
        typeof item.unit === "string" && item.unit.trim()
          ? item.unit.trim()
          : "lb";

      if (
        !allowedServiceTypes.includes(
          serviceType as (typeof allowedServiceTypes)[number],
        )
      ) {
        throw new Error(`Invalid service type for item ${index + 1}`);
      }

      if (!serviceName) {
        throw new Error(`Service name is required for item ${index + 1}`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Quantity must be greater than zero for item ${index + 1}`);
      }

      if (
        !Number.isInteger(unitPriceCents) ||
        unitPriceCents < 0
      ) {
        throw new Error(
          `unitPriceCents must be a non-negative integer for item ${index + 1}`,
        );
      }

      return {
        serviceType:
          serviceType as (typeof allowedServiceTypes)[number],
        serviceName,
        quantity,
        unit,
        unitPriceCents,
        totalCents: Math.round(quantity * unitPriceCents),
        notes: optionalText(item.notes),
      };
    });

    const subtotalCents = items.reduce(
      (sum, item) => sum + item.totalCents,
      0,
    );

    const deliveryFeeCents =
      body.deliveryFeeCents === undefined ||
      body.deliveryFeeCents === null
        ? 0
        : Number(body.deliveryFeeCents);

    if (
      !Number.isInteger(deliveryFeeCents) ||
      deliveryFeeCents < 0
    ) {
      return NextResponse.json(
        {
          error:
            "deliveryFeeCents must be a non-negative integer",
        },
        { status: 400 },
      );
    }

    const totalCents = subtotalCents + deliveryFeeCents;

    const priority =
      typeof body.priority === "string" &&
      allowedPriorities.includes(
        body.priority as (typeof allowedPriorities)[number],
      )
        ? (body.priority as (typeof allowedPriorities)[number])
        : "NORMAL";

    const paymentStatus =
      typeof body.paymentStatus === "string" &&
      allowedPaymentStatuses.includes(
        body.paymentStatus as (typeof allowedPaymentStatuses)[number],
      )
        ? (body.paymentStatus as (typeof allowedPaymentStatuses)[number])
        : "PENDING";

    const subscription = await prisma.subscription.findUnique({
      where: {
        workspaceId: workspace.id,
      },
    });

    if (
      subscription &&
      subscription.monthlyOrdersUsed >= subscription.orderLimit
    ) {
      return NextResponse.json(
        {
          error:
            "Monthly order limit reached. Upgrade your plan to create more orders.",
        },
        { status: 402 },
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.laundryOrder.create({
        data: {
          workspaceId: workspace.id,
          customerId: customer.id,
          createdById: user.id,
          orderNumber: createOrderNumber(),
          priority,
          paymentStatus,
          subtotalCents,
          deliveryFeeCents,
          totalCents,
          pickupAddress:
            optionalText(body.pickupAddress) ??
            customer.address,
          deliveryAddress:
            optionalText(body.deliveryAddress) ??
            customer.address,
          pickupDate: parseOptionalDate(body.pickupDate),
          deliveryDate: parseOptionalDate(body.deliveryDate),
          notes: optionalText(body.notes),

          items: {
            create: items,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      await tx.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          totalOrders: {
            increment: 1,
          },
          totalSpentCents: {
            increment: totalCents,
          },
        },
      });

      await tx.subscription.update({
        where: {
          workspaceId: workspace.id,
        },
        data: {
          monthlyOrdersUsed: {
            increment: 1,
          },
        },
      });

      await tx.usageEvent.create({
        data: {
          workspaceId: workspace.id,
          type: "order.created",
          quantity: 1,
          resourceId: createdOrder.id,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: "order.created",
          resourceType: "LaundryOrder",
          resourceId: createdOrder.id,
          newValues: {
            orderNumber: createdOrder.orderNumber,
            customerId: createdOrder.customerId,
            totalCents: createdOrder.totalCents,
            status: createdOrder.status,
          },
        },
      });

      return createdOrder;
    });

    return NextResponse.json(
      { order },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create order:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create order";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}