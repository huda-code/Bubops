import { NextResponse } from "next/server";
import { getCurrentDatabaseUser } from "@/lib/current-user";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export async function GET() {
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        status: workspace.status,
        role,
        plan: workspace.subscription?.plan ?? "free",
        subscriptionStatus:
          workspace.subscription?.status ?? "FREE",
        orderLimit:
          workspace.subscription?.orderLimit ?? 25,
        monthlyOrdersUsed:
          workspace.subscription?.monthlyOrdersUsed ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to load BubOps user:", error);

    return NextResponse.json(
      { error: "Unable to load user workspace" },
      { status: 500 },
    );
  }
}