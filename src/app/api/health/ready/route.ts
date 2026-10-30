import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authConfigured = Boolean(process.env.AUTH_SECRET && Buffer.byteLength(process.env.AUTH_SECRET) >= 32);
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();
    const ready = authConfigured;
    return NextResponse.json(
      {
        ok: ready,
        app: "PINAKK Marketplace",
        checks: {
          database: "connected",
          authentication: authConfigured ? "configured" : "missing_or_too_short",
        },
        timestamp: new Date().toISOString(),
      },
      { status: ready ? 200 : 503 }
    );
  } catch (error) {
    console.error("Readiness check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        app: "PINAKK Marketplace",
        checks: {
          database: "unavailable",
          authentication: authConfigured ? "configured" : "missing_or_too_short",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
