import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public order placement
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.phone || !body.items) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const orderNumber = `CH-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(Date.now()).slice(-4)}`;

    const items = typeof body.items === "string" ? body.items : JSON.stringify(body.items);
    const subtotal = body.subtotal || 0;
    const deliveryFee = body.deliveryFee || 15;
    const total = subtotal + deliveryFee;
    const deposit = body.deposit || 0;
    const remaining = total - deposit;
    const timeline = JSON.stringify([{ stage: "new", at: now.toISOString(), by: "customer" }]);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: body.customerName,
        phone: body.phone,
        address: body.address || "",
        zone: body.zone || "الحي الثاني",
        items,
        subtotal,
        deliveryFee,
        total,
        deposit,
        remaining,
        paymentMethod: body.paymentMethod || "cash",
        notes: body.notes || "",
        customerEmail: body.customerEmail || null,
        customerId: body.customerId || null,
        timeline,
        status: "new",
      },
    });

    // Auto-save/update customer in Customer database
    try {
      const cleanPhone = String(body.phone).trim();
      const cleanName = String(body.customerName).trim();
      const cleanAddr = String(body.address || "").trim();
      const cleanZone = String(body.zone || "الحي الثاني").trim();
      const cleanEmail = body.customerEmail ? String(body.customerEmail).trim().toLowerCase() : null;

      await prisma.$executeRawUnsafe(`
        INSERT INTO "Customer" (id, name, phone, email, address, zone, "isVerified", "updatedAt")
        VALUES (
          ${`'cust_${Date.now()}'`},
          ${`'${cleanName.replace(/'/g, "''")}'`},
          ${`'${cleanPhone.replace(/'/g, "''")}'`},
          ${cleanEmail ? `'${cleanEmail.replace(/'/g, "''")}'` : 'NULL'},
          ${`'${cleanAddr.replace(/'/g, "''")}'`},
          ${`'${cleanZone.replace(/'/g, "''")}'`},
          false,
          NOW()
        )
        ON CONFLICT (phone) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          zone = EXCLUDED.zone,
          "updatedAt" = NOW();
      `);
    } catch (custErr) {
      console.warn("Auto-save customer error:", custErr);
    }

    // Check if Owner WhatsApp order alerts are enabled in Settings
    let whatsappNotify: { enabled: boolean; targetPhone: string; waUrl: string } | null = null;
    try {
      const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
      if (settings?.whatsappOrdersEnabled) {
        const targetPhone = settings.ownerWhatsapp || settings.phone || "01091413470";
        const cleanTarget = targetPhone.replace(/[^0-9]/g, "");
        const fullTarget = cleanTarget.startsWith("2") ? cleanTarget : `2${cleanTarget}`;

        let parsedItems: any[] = [];
        try {
          parsedItems = typeof body.items === "string" ? JSON.parse(body.items) : body.items;
        } catch {}

        const itemsLines = parsedItems
          .map((i: any) => `• ${i.nameAr || i.nameEn || "صنف"} (×${i.qty}) - ${Number(i.unitPrice || 0) * Number(i.qty || 1)} ج`)
          .join("\n");

        const paymentLabel =
          body.paymentMethod === "cash" ? "كاش عند الاستلام 💵" :
          body.paymentMethod === "instapay" ? "إنستاباي ⚡" :
          body.paymentMethod === "wallet" ? "محفظة كاش 📱" : "فيزا / كارت 💳";

        const origin = req.headers.get("origin") || "https://waffle-cake.vercel.app";
        const receiptUrl = `${origin}/receipt/${order.id}`;

        const waText =
          `🔔 أوردر جديد تم تسجيله على السيستم!\n` +
          `-------------------------------\n` +
          `رقم الأوردر: #${orderNumber}\n` +
          `👤 العميل: ${body.customerName}\n` +
          `📱 الهاتف: ${body.phone}\n` +
          `📍 العنوان: ${body.address || "استلام"} (${body.zone || "الحي الثاني"})\n` +
          `-------------------------------\n` +
          `📋 الأصناف المطلوبة:\n${itemsLines}\n` +
          `-------------------------------\n` +
          `المجموع الفرعي: ${subtotal} ج\n` +
          `خدمة التوصيل: ${deliveryFee} ج\n` +
          `💰 الإجمالي المطلوب تحصيله: ${total} ج.م\n` +
          `💳 طريقة الدفع: ${paymentLabel}\n` +
          (body.notes ? `📝 ملاحظات: ${body.notes}\n` : "") +
          `-------------------------------\n` +
          `🔗 رابط الفاتورة والتتبع المباشر:\n${receiptUrl}`;

        whatsappNotify = {
          enabled: true,
          targetPhone,
          waUrl: `https://wa.me/${fullTarget}?text=${encodeURIComponent(waText)}`,
        };
      }
    } catch (waErr) {
      console.warn("WhatsApp notification preparation error:", waErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      whatsappNotify,
    }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
