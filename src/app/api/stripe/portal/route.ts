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

    const subscription = await prisma.subscription.findUnique({
      where: {
        workspaceId: workspace.id,
      },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer exists for this workspace" },
        { status: 400 },
      );
    }

    const appBaseUrl =
      process.env.APP_BASE_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: appBaseUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Failed to create billing portal session:", error);

    return NextResponse.json(
      { error: "Unable to open billing portal" },
      { status: 500 },
    );
  }
}