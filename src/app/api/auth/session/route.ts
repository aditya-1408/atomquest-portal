import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const roleFromDb = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin",
} as const;

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleFromDb[user.role],
      department: user.department,
      managerId: user.managerId ?? undefined,
    },
  });
}
