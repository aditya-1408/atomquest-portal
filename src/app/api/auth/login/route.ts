import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const demoPassword = process.env.DEMO_LOGIN_PASSWORD;

  if (!demoPassword) {
    return NextResponse.json({ error: "DEMO_LOGIN_PASSWORD is not configured." }, { status: 500 });
  }

  if (!email || !password || password !== demoPassword) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  return NextResponse.json({ userId: user.id });
}
