import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nameAr, nameEn, image, sortOrder } = body;

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json({ error: "اسم القسم مطلوب بالعربية" }, { status: 400 });
    }

    const trimmedAr = nameAr.trim();
    const existing = await prisma.category.findUnique({
      where: { nameAr: trimmedAr },
    });

    if (existing) {
      return NextResponse.json({ error: "هذا القسم موجود بالفعل" }, { status: 400 });
    }

    const count = await prisma.category.count();
    const created = await prisma.category.create({
      data: {
        nameAr: trimmedAr,
        nameEn: nameEn?.trim() || "",
        image: image || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : count + 1,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, nameAr, nameEn, image, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف القسم مطلوب للتعديل" }, { status: 400 });
    }

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json({ error: "اسم القسم مطلوب بالعربية" }, { status: 400 });
    }

    const trimmedAr = nameAr.trim();

    const existingCat = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCat) {
      return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
    }

    // Check if another category already has this name
    if (existingCat.nameAr !== trimmedAr) {
      const duplicate = await prisma.category.findUnique({
        where: { nameAr: trimmedAr },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: "يوجد قسم آخر بنفس هذا الاسم بالفعل" }, { status: 400 });
      }
    }

    const oldNameAr = existingCat.nameAr;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        nameAr: trimmedAr,
        nameEn: nameEn !== undefined ? (nameEn?.trim() || "") : existingCat.nameEn,
        image: image !== undefined ? (image || null) : existingCat.image,
        sortOrder: typeof sortOrder === "number" ? sortOrder : existingCat.sortOrder,
      },
    });

    // If category name changed, update all existing products under the old category name
    if (oldNameAr !== trimmedAr) {
      await prisma.product.updateMany({
        where: { category: oldNameAr },
        data: { category: trimmedAr },
      });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const PUT = PATCH;

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "معرف القسم مطلوب" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
