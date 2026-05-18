import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { buildAzureAuthorizeUrl, isAzureSsoConfigured } from "@/lib/azure-ad";

export const runtime = "nodejs";

export const ssoStateCookieName = "atomquest_sso_state";

export async function GET() {
  if (!isAzureSsoConfigured()) {
    return NextResponse.redirect(new URL("/?sso_error=Microsoft%20SSO%20is%20not%20configured.", process.env.APP_BASE_URL ?? "http://localhost:3000"));
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(buildAzureAuthorizeUrl(state));
  response.cookies.set(ssoStateCookieName, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
