import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieName } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

const roleToDb = {
  Employee: "EMPLOYEE",
  Manager: "MANAGER",
  Admin: "ADMIN",
} as const;

type SignupRole = keyof typeof roleToDb;

function validRole(role: string): role is SignupRole {
  return role === "Employee" || role === "Manager" || role === "Admin";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      department?: string;
      managerEmail?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const role = body.role ?? "";
    const department = body.department?.trim() || "Operations";

    if (!name || !email || !password || !validRole(role)) {
      return NextResponse.json({ error: "Name, email, password, and role are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    }

    const managerEmail = role === "Employee" ? body.managerEmail?.trim().toLowerCase() : "";
    if (role === "Employee" && !managerEmail) {
      return NextResponse.json({ error: "Employee signup requires an existing manager email." }, { status: 400 });
    }

    const manager =
      managerEmail
        ? await prisma.user.findUnique({
            where: { email: managerEmail },
            select: { id: true, role: true },
          })
        : null;

    if (managerEmail && (!manager || manager.role !== "MANAGER")) {
      return NextResponse.json({ error: "Manager email must belong to an existing manager account." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: roleToDb[role],
        department,
        managerId: manager?.id,
        passwordHash: await hashPassword(password),
      },
      select: { id: true },
    });

    const response = NextResponse.json({ userId: user.id });
    response.cookies.set(sessionCookieName, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed." },
      { status: 500 },
    );
  }
}
