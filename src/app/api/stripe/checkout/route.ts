import { NextResponse } from "next/server";
import { getCurrentDatabaseUser } from "@/lib/current-user";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
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

    if (role !== "OWNER" && role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Only owners can manage billing" },
        { status: 403 },
      );
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const appBaseUrl =
      process.env.APP_BASE_URL ?? "http://localhost:3000";

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe Pro price is not configured" },
        { status: 500 },
      );
    }

    let subscription = await prisma.subscription.findUnique({
      where: {
        workspaceId: workspace.id,
      },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          plan: "free",
          status: "FREE",
          orderLimit: 25,
          monthlyOrdersUsed: 0,
        },
      });
    }
    if (
  subscription.status === "ACTIVE" &&
  subscription.stripeCustomerId
) {
  const portalSession =
    await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: appBaseUrl,
    });

  return NextResponse.json({
    url: portalSession.url,
    destination: "portal",
  });
}

    let stripeCustomerId = subscription.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: workspace.name,
        metadata: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.subscription.update({
        where: {
          workspaceId: workspace.id,
        },
        data: {
          stripeCustomerId,
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appBaseUrl}/?checkout=success`,
      cancel_url: `${appBaseUrl}/?checkout=cancelled`,
      metadata: {
        workspaceId: workspace.id,
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          workspaceId: workspace.id,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Failed to create Checkout Session:", error);

    return NextResponse.json(
      { error: "Unable to start Stripe Checkout" },
      { status: 500 },
    );
  }
}