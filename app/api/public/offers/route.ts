import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_OFFERS = {
  enabled: true,
  badge: "عروض محدودة",
  title: "العروض الخاصة",
  subtitle: "عروض متجددة كل أسبوع — اسأل الكاشير عن عرض اليوم",
  cards: [
    {
      id: "combo",
      title: "كومبو الشلة",
      desc: "وافل + ميلك شيك + تشيز كيك بسعر 299 ج م بدل 320 ج م",
      icon: "party",
    },
    {
      id: "delivery",
      title: "توصيل مجاني",
      desc: "اطلب بأكثر من 350 ج م والتوصيل علينا داخل 6 أكتوبر",
      icon: "delivery",
    },
    {
      id: "student",
      title: "خصم الطلبة",
      desc: "10% خصم على المنيو كله بكارنيه الطالب",
      icon: "student",
    },
  ],
  banner: {
    badge: "الأكثر طلباً هذا الأسبوع",
    title: "ميني بان كيك نوتيلا",
    linkText: "شـوفـه فـي الـمـنـيـو",
    linkHref: "#menu",
    image: "/whacka-offers-banner.jpg",
  },
};

let cachedOffers: any = null;
let lastOffersTime = 0;
const OFFERS_TTL_MS = 30_000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedOffers && now - lastOffersTime < OFFERS_TTL_MS) {
      return NextResponse.json(cachedOffers);
    }

    const setting = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { specialOffers: true, offersEnabled: true },
    });

    let data: any = { ...DEFAULT_OFFERS };
    if (setting?.specialOffers) {
      try {
        const parsed = JSON.parse(setting.specialOffers);
        data = { ...DEFAULT_OFFERS, ...parsed };
      } catch {
        // Fallback
      }
    }

    data.enabled = setting?.offersEnabled ?? (data.enabled !== false);
    cachedOffers = data;
    lastOffersTime = now;
    return NextResponse.json(data);
  } catch {
    cachedOffers = DEFAULT_OFFERS;
    lastOffersTime = Date.now();
    return NextResponse.json(DEFAULT_OFFERS);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const isEnabled = body.enabled !== undefined ? Boolean(body.enabled) : true;
    body.enabled = isEnabled;
    const jsonStr = JSON.stringify(body);

    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { 
        specialOffers: jsonStr,
        offersEnabled: isEnabled,
      },
      create: {
        id: "default",
        specialOffers: jsonStr,
        offersEnabled: isEnabled,
      },
    });

    cachedOffers = body;
    lastOffersTime = Date.now();

    return NextResponse.json({ success: true, offers: body });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
