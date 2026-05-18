import { NextResponse } from "next/server";
import {
  azureGroupNames,
  emailFromAzureProfile,
  exchangeAzureCode,
  getAzureGroups,
  getAzureManager,
  getAzureProfile,
  isAzureSsoConfigured,
  roleFromAzureGroups,
} from "@/lib/azure-ad";
import { createSessionToken, sessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifySsoState } from "@/lib/sso-state";

export const runtime = "nodejs";

function redirectHome(request: Request, params: Record<string, string>) {
  const url = new URL("/", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(redirectHome(request, { sso_error: message }));
}

export async function GET(request: Request) {
  if (!isAzureSsoConfigured()) {
    return redirectWithError(request, "Microsoft SSO is not configured.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const azureError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (azureError) return redirectWithError(request, azureError);
  if (!code || !state) return redirectWithError(request, "Microsoft SSO callback was missing code or state.");

  if (!verifySsoState(state)) {
    return redirectWithError(request, "Microsoft SSO state check failed. Please try again.");
  }

  try {
    const token = await exchangeAzureCode(code);
    const profile = await getAzureProfile(token.access_token);
    if (!profile) return redirectWithError(request, "Microsoft profile could not be loaded.");

    const email = emailFromAzureProfile(profile);
    if (!email) return redirectWithError(request, "Microsoft account did not provide an email address.");

    const [managerProfile, groups] = await Promise.all([
      getAzureManager(token.access_token),
      getAzureGroups(token.access_token),
    ]);
    const managerEmail = managerProfile ? emailFromAzureProfile(managerProfile) : "";
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    const role = roleFromAzureGroups(groups, existingUser?.role);

    const manager =
      managerEmail && managerEmail !== email
        ? await prisma.user.upsert({
            where: { email: managerEmail },
            update: {
              name: managerProfile?.displayName ?? managerEmail,
              department: managerProfile?.department || "Operations",
              role: "MANAGER",
            },
            create: {
              name: managerProfile?.displayName ?? managerEmail,
              email: managerEmail,
              department: managerProfile?.department || "Operations",
              role: "MANAGER",
            },
            select: { id: true },
          })
        : null;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: profile.displayName || email,
        department: profile.department || "Operations",
        role,
        managerId: role === "EMPLOYEE" ? manager?.id ?? null : null,
      },
      create: {
        name: profile.displayName || email,
        email,
        department: profile.department || "Operations",
        role,
        managerId: role === "EMPLOYEE" ? manager?.id ?? null : null,
      },
      select: { id: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "SSO login via Microsoft Entra ID",
        afterJson: {
          email,
          role,
          managerEmail: managerEmail || null,
          azureGroups: azureGroupNames(groups),
        },
      },
    });

    const response = NextResponse.redirect(redirectHome(request, { sso_success: "1" }));
    response.cookies.set(sessionCookieName, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return redirectWithError(
      request,
      error instanceof Error ? error.message : "Microsoft SSO login failed.",
    );
  }
}
