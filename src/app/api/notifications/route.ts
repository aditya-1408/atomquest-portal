import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { atomQuestLink, sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type NotificationEvent =
  | "GOAL_SUBMITTED"
  | "GOAL_UPDATED"
  | "GOAL_APPROVED"
  | "GOAL_RETURNED"
  | "CHECK_IN_COMPLETED"
  | "CYCLE_PHASE_CHANGED";

type NotificationRequest = {
  event?: NotificationEvent;
  employeeId?: string;
  managerId?: string;
  phase?: string;
  comment?: string;
};

function roleLabel(role: string) {
  return role === "ADMIN" ? "Admin / HR" : role === "MANAGER" ? "Manager" : "Employee";
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as NotificationRequest;
  if (!body.event) {
    return NextResponse.json({ error: "Notification event is required." }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });
  const employee = users.find((user) => user.id === body.employeeId);
  const manager =
    users.find((user) => user.id === body.managerId) ??
    users.find((user) => user.id === employee?.managerId);
  const admins = users.filter((user) => user.role === "ADMIN");

  let title = "AtomQuest Notification";
  let message = "A goal workflow event needs attention.";
  let recipients: string[] = [];
  let deepLink = atomQuestLink("/", { view: "Dashboard" });

  if (body.event === "GOAL_SUBMITTED" && employee && manager) {
    title = "New goal sheet submitted";
    message = `${employee.name} submitted a goal sheet for L1 review.`;
    recipients = [manager.email];
    deepLink = atomQuestLink("/", { view: "Approvals", employeeId: employee.id });
  }

  if (body.event === "GOAL_UPDATED" && employee && manager) {
    title = "Goal achievement updated";
    message = `${employee.name} updated goal achievement progress for manager review.`;
    recipients = [manager.email];
    deepLink = atomQuestLink("/", { view: "Check-ins", employeeId: employee.id });
  }

  if (body.event === "GOAL_APPROVED" && employee) {
    title = "Goal sheet approved";
    message = `${employee.name}'s goal sheet was approved and locked.`;
    recipients = [employee.email];
    deepLink = atomQuestLink("/", { view: "Goals", employeeId: employee.id });
  }

  if (body.event === "GOAL_RETURNED" && employee) {
    title = "Goal sheet returned for rework";
    message = `${employee.name}'s goal sheet was returned for rework.${body.comment ? ` Comment: ${body.comment}` : ""}`;
    recipients = [employee.email];
    deepLink = atomQuestLink("/", { view: "Goals", employeeId: employee.id });
  }

  if (body.event === "CHECK_IN_COMPLETED" && employee && manager) {
    title = "Quarterly check-in completed";
    message = `${manager.name} completed a quarterly check-in for ${employee.name}.`;
    recipients = [employee.email, manager.email];
    deepLink = atomQuestLink("/", { view: "Check-ins", employeeId: employee.id });
  }

  if (body.event === "CYCLE_PHASE_CHANGED") {
    title = "Cycle phase changed";
    message = `${sessionUser.name} changed the active cycle phase to ${body.phase ?? "a new phase"}.`;
    recipients = users.map((user) => user.email);
    deepLink = atomQuestLink("/", { view: roleLabel(sessionUser.role) === "Admin / HR" ? "Users & Cycles" : "Dashboard" });
  }

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
      actorId: sessionUser.id,
      entityType: "Notification",
      entityId: body.employeeId ?? body.phase ?? body.event,
      action: `Notification ${body.event}`,
      afterJson: {
        email: result.email,
        teams: result.teams,
        recipients,
        deepLink,
        admins: admins.map((admin) => admin.email),
        errors: result.errors,
      },
    },
  });

  return NextResponse.json({ ok: true, result });
}
