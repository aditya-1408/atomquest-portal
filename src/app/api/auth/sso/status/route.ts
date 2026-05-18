import { NextResponse } from "next/server";
import { isAzureSsoConfigured } from "@/lib/azure-ad";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ configured: isAzureSsoConfigured() });
}
