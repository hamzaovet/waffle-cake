import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

/* ── GET /api/auth/users — list all users (includes username) ── */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, phone: true, role: true, department: true, avatar: true, username: true },
    });
    return NextResponse.json(users);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── POST /api/auth/users — create new user ── */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, role, department, username, password } = body;

    if (!name || !role)
      return NextResponse.json({ error: "الاسم والدور مطلوبان" }, { status: 400 });

    const passwordHash = password ? sha256(String(password)) : null;
    const uname        = username?.trim() || null;
    const dept         = department || null;
    const ph           = phone || null;

    const user = await prisma.user.create({
      data: {
        name,
        phone: ph ?? '00000000000',
        pin: '000000',
        role,
        department: dept,
        username: uname,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
        username: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
