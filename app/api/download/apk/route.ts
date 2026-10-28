import { NextResponse } from "next/server";

export async function GET() {
  const downloadUrl =
    process.env.APK_DOWNLOAD_URL ||
    "https://github.com/hamzaovet/waffle-cake/releases/latest/download/waffle-cake.apk";

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
