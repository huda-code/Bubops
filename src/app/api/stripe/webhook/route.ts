import { NextResponse } from "next/server";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;

      if (!workspaceId) {
        console.error("Checkout session is missing workspaceId");
        return NextResponse.json(
          { error: "Missing workspace metadata" },
          { status: 400 },
        );
      }

      await prisma.subscription.update({
        where: {
          workspaceId,
        },
        data: {
          plan: "pro",
          status: "ACTIVE",
          orderLimit: 1000,
          stripeCustomerId:
            typeof session.customer === "string"
              ? session.customer
              : undefined,
        },
      });

     await prisma.auditLog.create({
  data: {
    workspaceId,
    action: "SUBSCRIPTION_UPGRADED",
    resourceType: "Subscription",
    resourceId: workspaceId,
    metadata: {
      plan: "pro",
      source: "stripe_checkout",
      checkoutSessionId: session.id,
    },
  },
});
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}