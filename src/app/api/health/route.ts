import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requiredConfig = ["PINAKK_ADMIN_EMAIL", "PINAKK_ADMIN_PASSWORD", "AUTH_SECRET"];
  const missingConfig = requiredConfig.filter((key) => !process.env[key]);
  const authSecretReady = Boolean(process.env.AUTH_SECRET && Buffer.byteLength(process.env.AUTH_SECRET) >= 32);

  if (missingConfig.length > 0 || !authSecretReady) {
    return NextResponse.json(
      {
        ok: false,
        app: "PINAKK Marketplace",
        status: "not_ready",
        checks: {
          configuration: "failed",
          database: "not_checked",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    await connectToDatabase();
    return NextResponse.json(
      {
        ok: true,
        app: "PINAKK Marketplace",
        status: "healthy",
        checks: {
          configuration: "ready",
          database: "connected",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("PINAKK readiness check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        app: "PINAKK Marketplace",
        status: "not_ready",
        checks: {
          configuration: "ready",
          database: "unavailable",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
