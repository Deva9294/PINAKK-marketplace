import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdminRequest } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/user-auth";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const staff = await User.find({ role: "delivery" })
      .select("name phone email active createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    console.error("Admin delivery staff lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load delivery staff. Check the database connection and server logs." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.replace(/[\\s-]/g, "") : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (
    name.length < 2 ||
    name.length > 100 ||
    !/^(?:\\+91)?[6-9]\\d{9}$/.test(phone) ||
    password.length < 10 ||
    password.length > 128
  ) {
    return NextResponse.json(
      { ok: false, error: "Name, valid 10-digit Indian mobile and password (10–128 characters) are required." },
      { status: 400 }
    );
  }

  if (!process.env.AUTH_SECRET || Buffer.byteLength(process.env.AUTH_SECRET) < 32) {
    console.error("Delivery account creation unavailable: AUTH_SECRET is missing or shorter than 32 bytes.");
    return NextResponse.json(
      { ok: false, error: "Account security is not configured correctly. Check AUTH_SECRET in Render environment variables." },
      { status: 503 }
    );
  }

  try {
    await connectToDatabase();

    const existing = await User.findOne({ phone }).select("_id").lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "This mobile number is already registered. Use a different number." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, phone, passwordHash, role: "delivery", active: true });

    return NextResponse.json(
      { ok: true, staff: { id: String(user._id), name: user.name, phone: user.phone, role: user.role } },
      { status: 201 }
    );
  } catch (error) {
    const dbError = error as {
      name?: string;
      code?: number;
      codeName?: string;
      keyPattern?: Record<string, unknown>;
      message?: string;
    };

    // Keep credentials and personal data out of logs; record only diagnostic metadata.
    console.error("Admin delivery account creation failed:", {
      name: dbError?.name,
      code: dbError?.code,
      codeName: dbError?.codeName,
      keyPattern: dbError?.keyPattern,
      message: dbError?.message,
    });

    if (dbError?.code === 11000) {
      return NextResponse.json(
        { ok: false, error: "This mobile number is already registered. Use a different number." },
        { status: 409 }
      );
    }

    if (dbError?.name === "ValidationError") {
      return NextResponse.json(
        { ok: false, error: "Delivery account details are invalid. Check the name and mobile number." },
        { status: 400 }
      );
    }

    if (dbError?.name === "MongoServerSelectionError" || dbError?.name === "MongooseServerSelectionError") {
      return NextResponse.json(
        { ok: false, error: "Database is not reachable. Check MONGODB_URI, Atlas network access and Render logs." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Could not create delivery account. Check the Render Runtime Logs for 'Admin delivery account creation failed'." },
      { status: 503 }
    );
  }
}
