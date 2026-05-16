import { NextResponse } from "next/server";
import { atomQuestLink, sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const phaseToQuarter = {
  Q1_CHECK_IN: "Q1",
  Q2_CHECK_IN: "Q2",
  Q3_CHECK_IN: "Q3",
  Q4_ANNUAL: "Q4",
} as const;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const cycle = await prisma.cycle.findFirst({ orderBy: { createdAt: "asc" } });
  const quarter = cycle ? phaseToQuarter[cycle.phase as keyof typeof phaseToQuarter] : undefined;
  if (!cycle || !quarter) {
    return NextResponse.json({ ok: true, sent: 0, reason: "No active quarterly check-in phase." });
  }

  const [users, goals, updates, checkIns] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, managerId: true } }),
    prisma.goal.findMany({ where: { cycleId: cycle.id, status: "APPROVED" } }),
    prisma.quarterlyUpdate.findMany({ where: { quarter } }),
    prisma.checkIn.findMany({ where: { cycleId: cycle.id, quarter } }),
  ]);

  let sent = 0;
  for (const employee of users.filter((user) => user.role === "EMPLOYEE")) {
    const manager = users.find((user) => user.id === employee.managerId);
    const employeeGoals = goals.filter((goal) => goal.employeeId === employee.id);
    if (employeeGoals.length === 0) continue;

    const missingUpdates = employeeGoals.some(
      (goal) => !updates.some((update) => update.goalId === goal.id),
    );
    const missingCheckIn = !checkIns.some((checkIn) => checkIn.employeeId === employee.id);
    if (!missingUpdates && !missingCheckIn) continue;

    const recipients = [employee.email, manager?.email].filter(Boolean) as string[];
    const title = `${quarter} check-in reminder`;
    const message = missingUpdates
      ? `${employee.name} has pending ${quarter} achievement updates.`
      : `${employee.name}'s ${quarter} manager check-in is pending.`;
    const deepLink = atomQuestLink("/", {
      view: missingUpdates ? "Quarterly Update" : "Check-ins",
      employeeId: employee.id,
    });

    const result = await sendNotification({
      title,
      message,
      deepLink,
      email: {
        to: recipients,
        subject: title,
        html: `<p>${message}</p><p><a href="${deepLink}">Open in AtomQuest</a></p>`,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: manager?.id ?? employee.id,
        entityType: "Notification",
        entityId: employee.id,
        action: `Cron reminder ${quarter}`,
        afterJson: { email: result.email, teams: result.teams, recipients, deepLink, errors: result.errors },
      },
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
