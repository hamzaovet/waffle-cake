import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let cachedSettings: any = null;
let lastSettingsTime = 0;
const SETTINGS_TTL_MS = 10_000; // 10 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (cachedSettings && now - lastSettingsTime < SETTINGS_TTL_MS) {
      return NextResponse.json(cachedSettings);
    }

    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          restaurantName: "Waffle & Cake",
          phone: "01091413470",
          address: "السادس من أكتوبر — الحي الأول",
          deliveryZones: JSON.stringify([
            { name: "الحي الثاني", fee: 15 },
            { name: "الحي الأول", fee: 20 },
            { name: "الحي المتميز", fee: 25 },
            { name: "الحصري", fee: 20 },
          ]),
          soundsEnabled: true,
          specialOffers: "open", // store status: open, busy, closed, disabled
          whatsappOrdersEnabled: false,
          ownerWhatsapp: "01091413470",
        },
      });
    }

    cachedSettings = settings;
    lastSettingsTime = now;
    return NextResponse.json(settings);
  } catch (err: unknown) {
    if (cachedSettings) return NextResponse.json(cachedSettings);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const updateData: any = {};
    if (body.restaurantName !== undefined) updateData.restaurantName = body.restaurantName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.soundsEnabled !== undefined) updateData.soundsEnabled = body.soundsEnabled;
    if (body.specialOffers !== undefined || body.status !== undefined) {
      updateData.specialOffers = body.specialOffers || body.status;
    }
    if (body.deliveryZones !== undefined) {
      updateData.deliveryZones = typeof body.deliveryZones === "string" ? body.deliveryZones : JSON.stringify(body.deliveryZones || []);
    }
    if (body.whatsappOrdersEnabled !== undefined) {
      updateData.whatsappOrdersEnabled = Boolean(body.whatsappOrdersEnabled);
    }
    if (body.ownerWhatsapp !== undefined) {
      updateData.ownerWhatsapp = body.ownerWhatsapp ? String(body.ownerWhatsapp).trim() : null;
    }

    const updated = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        restaurantName: body.restaurantName || "Waffle & Cake",
        phone: body.phone || "01091413470",
        address: body.address || "السادس من أكتوبر — الحي الأول",
        soundsEnabled: body.soundsEnabled ?? true,
        specialOffers: body.specialOffers || "open",
        deliveryZones: typeof body.deliveryZones === "string" ? body.deliveryZones : JSON.stringify(body.deliveryZones || []),
        whatsappOrdersEnabled: Boolean(body.whatsappOrdersEnabled),
        ownerWhatsapp: body.ownerWhatsapp ? String(body.ownerWhatsapp).trim() : "01091413470",
      },
    });

    cachedSettings = updated;
    lastSettingsTime = Date.now();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
