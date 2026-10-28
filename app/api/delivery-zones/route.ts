import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    const zones = await prisma.deliveryZone.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { nameAr: { contains: q, mode: "insensitive" } },
                { nameEn: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ fee: "asc" }, { nameAr: "asc" }],
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching delivery zones:", error);
    return NextResponse.json({ error: "Failed to fetch delivery zones" }, { status: 500 });
  }
}
