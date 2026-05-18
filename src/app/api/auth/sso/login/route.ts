import { NextResponse } from "next/server";
import { buildAzureAuthorizeUrl, isAzureSsoConfigured } from "@/lib/azure-ad";
import { createSsoState } from "@/lib/sso-state";

export const runtime = "nodejs";

export async function GET() {
  if (!isAzureSsoConfigured()) {
    return NextResponse.redirect(new URL("/?sso_error=Microsoft%20SSO%20is%20not%20configured.", process.env.APP_BASE_URL ?? "http://localhost:3000"));
  }

  return NextResponse.redirect(buildAzureAuthorizeUrl(createSsoState()));
}
