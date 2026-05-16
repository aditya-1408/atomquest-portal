import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

type Role = "Employee" | "Manager" | "Admin";
type UomType = "Numeric" | "Percentage" | "Timeline" | "Zero";
type Direction = "Min" | "Max";
type GoalStatus = "Draft" | "Submitted" | "Approved" | "Returned";
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
type ProgressStatus = "Not Started" | "On Track" | "Completed";

type AppState = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: Role;
    department: string;
    managerId?: string;
  }>;
  goals: Array<{
    id: string;
    employeeId: string;
    thrustArea: string;
    title: string;
    description: string;
    uomType: UomType;
    direction: Direction;
    targetValue: number;
    targetDate: string;
    weightage: number;
    status: GoalStatus;
    locked: boolean;
    sharedGoalId?: string;
    primaryOwner?: boolean;
  }>;
  updates: Array<{
    id: string;
    goalId: string;
    quarter: Quarter;
    actualValue: number;
    actualDate: string;
    status: ProgressStatus;
    employeeComment: string;
    progressScore: number;
  }>;
  checkIns: Array<{
    id: string;
    employeeId: string;
    managerId: string;
    quarter: Quarter;
    comment: string;
    completedAt: string;
  }>;
  sharedGoals: Array<{
    id: string;
    ownerId: string;
    title: string;
    description: string;
    thrustArea: string;
    uomType: UomType;
    direction: Direction;
    targetValue: number;
    targetDate: string;
  }>;
  auditLogs: Array<{
    id: string;
    actor: string;
    action: string;
    entity: string;
    before?: string;
    after?: string;
    createdAt: string;
  }>;
  cycle: {
    name: string;
    phase: string;
    windows: Record<string, string>;
  };
};

type DbUser = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof roleFromDb;
  department: string;
  managerId: string | null;
};

type DbGoal = {
  id: string;
  employeeId: string;
  sharedGoalId: string | null;
  thrustArea: string;
  title: string;
  description: string;
  uomType: keyof typeof uomFromDb;
  direction: keyof typeof directionFromDb;
  targetValue: number;
  targetDate: Date;
  weightage: number;
  status: keyof typeof goalStatusFromDb;
  isLocked: boolean;
  primaryOwner: boolean;
};

type DbUpdate = {
  id: string;
  goalId: string;
  quarter: Quarter;
  actualValue: number;
  actualDate: Date;
  status: keyof typeof progressFromDb;
  employeeComment: string | null;
  progressScore: number;
};

type DbCheckIn = {
  id: string;
  employeeId: string;
  managerId: string;
  quarter: Quarter;
  comment: string;
  completedAt: Date;
};

type DbSharedGoal = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: keyof typeof uomFromDb;
  direction: keyof typeof directionFromDb;
  targetValue: number;
  targetDate: Date;
};

type DbAuditLog = {
  id: string;
  actor: { name: string };
  action: string;
  entityId: string;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: Date;
};

type DbCycle = {
  id: string;
  name: string;
  phase: keyof typeof phaseFromDb;
};

type TransactionClient = Pick<
  typeof prisma,
  "cycle" | "sharedGoal" | "goal" | "quarterlyUpdate" | "checkIn" | "auditLog"
>;

const roleFromDb = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin",
} as const;

const uomFromDb = {
  NUMERIC: "Numeric",
  PERCENTAGE: "Percentage",
  TIMELINE: "Timeline",
  ZERO: "Zero",
} as const;

const uomToDb = {
  Numeric: "NUMERIC",
  Percentage: "PERCENTAGE",
  Timeline: "TIMELINE",
  Zero: "ZERO",
} as const;

const directionFromDb = {
  MIN: "Min",
  MAX: "Max",
} as const;

const directionToDb = {
  Min: "MIN",
  Max: "MAX",
} as const;

const goalStatusFromDb = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  RETURNED: "Returned",
} as const;

const goalStatusToDb = {
  Draft: "DRAFT",
  Submitted: "SUBMITTED",
  Approved: "APPROVED",
  Returned: "RETURNED",
} as const;

const progressFromDb = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  COMPLETED: "Completed",
} as const;

const progressToDb = {
  "Not Started": "NOT_STARTED",
  "On Track": "ON_TRACK",
  Completed: "COMPLETED",
} as const;

const phaseFromDb = {
  GOAL_SETTING: "Goal Setting",
  Q1_CHECK_IN: "Q1 Check-in",
  Q2_CHECK_IN: "Q2 Check-in",
  Q3_CHECK_IN: "Q3 Check-in",
  Q4_ANNUAL: "Q4 / Annual",
  CLOSED: "Closed",
} as const;

const phaseToDb = {
  "Goal Setting": "GOAL_SETTING",
  "Q1 Check-in": "Q1_CHECK_IN",
  "Q2 Check-in": "Q2_CHECK_IN",
  "Q3 Check-in": "Q3_CHECK_IN",
  "Q4 / Annual": "Q4_ANNUAL",
  Closed: "CLOSED",
} as const;

const defaultWindows = {
  "Goal Setting": "Opens 1 May",
  "Q1 Check-in": "July",
  "Q2 Check-in": "October",
  "Q3 Check-in": "January",
  "Q4 / Annual": "March / April",
};

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function auditJsonToText(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "value" in value) {
    return auditJsonToText((value as { value?: unknown }).value);
  }
  return JSON.stringify(value);
}

function textToAuditJson(value?: string) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return { value };
  }
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const [users, cycle, goals, updates, checkIns, sharedGoals, auditLogs] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.cycle.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.goal.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.quarterlyUpdate.findMany({ orderBy: { updatedAt: "asc" } }),
    prisma.checkIn.findMany({ orderBy: { completedAt: "asc" } }),
    prisma.sharedGoal.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeCycle = cycle as DbCycle | null;

  if (!activeCycle) {
    return NextResponse.json({ error: "No active cycle found. Run prisma db seed first." }, { status: 404 });
  }

  const allUsers = users as DbUser[];
  const allGoals = goals as DbGoal[];
  const allUpdates = updates as DbUpdate[];
  const allCheckIns = checkIns as DbCheckIn[];
  const allSharedGoals = sharedGoals as DbSharedGoal[];
  const allAuditLogs = auditLogs as DbAuditLog[];

  const visibleEmployeeIds =
    sessionUser.role === "ADMIN"
      ? allUsers.filter((user) => user.role === "EMPLOYEE").map((user) => user.id)
      : sessionUser.role === "MANAGER"
        ? allUsers.filter((user) => user.managerId === sessionUser.id).map((user) => user.id)
        : [sessionUser.id];
  const visibleUserIds = new Set([
    sessionUser.id,
    ...visibleEmployeeIds,
    ...allUsers.filter((user) => visibleEmployeeIds.includes(user.id) && user.managerId).map((user) => user.managerId as string),
  ]);
  const visibleGoalIds = new Set(allGoals.filter((goal) => visibleEmployeeIds.includes(goal.employeeId)).map((goal) => goal.id));
  const visibleSharedGoalIds = new Set(
    allGoals
      .filter((goal) => visibleEmployeeIds.includes(goal.employeeId) && goal.sharedGoalId)
      .map((goal) => goal.sharedGoalId as string),
  );

  const scopedUsers = allUsers.filter((user) => visibleUserIds.has(user.id));
  const scopedGoals = allGoals.filter((goal) => visibleGoalIds.has(goal.id));
  const scopedUpdates = allUpdates.filter((update) => visibleGoalIds.has(update.goalId));
  const scopedCheckIns = allCheckIns.filter((checkIn) => visibleEmployeeIds.includes(checkIn.employeeId));
  const scopedSharedGoals =
    sessionUser.role === "ADMIN"
      ? allSharedGoals
      : allSharedGoals.filter((goal) => visibleSharedGoalIds.has(goal.id));
  const scopedAuditLogs =
    sessionUser.role === "ADMIN"
      ? allAuditLogs
      : allAuditLogs.filter((log) => visibleEmployeeIds.includes(log.entityId) || log.actor.name === sessionUser.name);

  const state: AppState = {
    users: scopedUsers.map((user: DbUser) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleFromDb[user.role],
      department: user.department,
      managerId: user.managerId ?? undefined,
    })),
    goals: scopedGoals.map((goal: DbGoal) => ({
      id: goal.id,
      employeeId: goal.employeeId,
      thrustArea: goal.thrustArea,
      title: goal.title,
      description: goal.description,
      uomType: uomFromDb[goal.uomType],
      direction: directionFromDb[goal.direction],
      targetValue: goal.targetValue,
      targetDate: dateOnly(goal.targetDate),
      weightage: goal.weightage,
      status: goalStatusFromDb[goal.status],
      locked: goal.isLocked,
      sharedGoalId: goal.sharedGoalId ?? undefined,
      primaryOwner: goal.primaryOwner,
    })),
    updates: scopedUpdates.map((update: DbUpdate) => ({
      id: update.id,
      goalId: update.goalId,
      quarter: update.quarter,
      actualValue: update.actualValue,
      actualDate: dateOnly(update.actualDate),
      status: progressFromDb[update.status],
      employeeComment: update.employeeComment ?? "",
      progressScore: update.progressScore,
    })),
    checkIns: scopedCheckIns.map((checkIn: DbCheckIn) => ({
      id: checkIn.id,
      employeeId: checkIn.employeeId,
      managerId: checkIn.managerId,
      quarter: checkIn.quarter,
      comment: checkIn.comment,
      completedAt: dateOnly(checkIn.completedAt),
    })),
    sharedGoals: scopedSharedGoals.map((goal: DbSharedGoal) => ({
      id: goal.id,
      ownerId: goal.ownerId,
      title: goal.title,
      description: goal.description,
      thrustArea: goal.thrustArea,
      uomType: uomFromDb[goal.uomType],
      direction: directionFromDb[goal.direction],
      targetValue: goal.targetValue,
      targetDate: dateOnly(goal.targetDate),
    })),
    auditLogs: scopedAuditLogs.map((log: DbAuditLog) => ({
      id: log.id,
      actor: log.actor.name,
      action: log.action,
      entity: log.entityId,
      before: auditJsonToText(log.beforeJson),
      after: auditJsonToText(log.afterJson),
      createdAt: log.createdAt.toISOString(),
    })),
    cycle: {
      name: activeCycle.name,
      phase: phaseFromDb[activeCycle.phase],
      windows: defaultWindows,
    },
  };

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const state = (await request.json()) as AppState;
  const cycle = await prisma.cycle.findFirst({ orderBy: { createdAt: "asc" } });

  if (!cycle) {
    return NextResponse.json({ error: "No active cycle found. Run prisma db seed first." }, { status: 404 });
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    if (sessionUser.role === "ADMIN" && state.cycle.phase in phaseToDb) {
      await tx.cycle.update({
        where: { id: cycle.id },
        data: { phase: phaseToDb[state.cycle.phase as keyof typeof phaseToDb] },
      });
    }

    for (const goal of state.sharedGoals) {
      await tx.sharedGoal.upsert({
        where: { id: goal.id },
        update: {
          ownerId: goal.ownerId,
          cycleId: cycle.id,
          department: state.users.find((user) => user.id === goal.ownerId)?.department ?? "Operations",
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description,
          uomType: uomToDb[goal.uomType],
          direction: directionToDb[goal.direction],
          targetValue: goal.targetValue,
          targetDate: new Date(goal.targetDate),
        },
        create: {
          id: goal.id,
          ownerId: goal.ownerId,
          cycleId: cycle.id,
          department: state.users.find((user) => user.id === goal.ownerId)?.department ?? "Operations",
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description,
          uomType: uomToDb[goal.uomType],
          direction: directionToDb[goal.direction],
          targetValue: goal.targetValue,
          targetDate: new Date(goal.targetDate),
        },
      });
    }

    for (const goal of state.goals) {
      await tx.goal.upsert({
        where: { id: goal.id },
        update: {
          employeeId: goal.employeeId,
          cycleId: cycle.id,
          sharedGoalId: goal.sharedGoalId ?? null,
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description,
          uomType: uomToDb[goal.uomType],
          direction: directionToDb[goal.direction],
          targetValue: goal.targetValue,
          targetDate: new Date(goal.targetDate),
          weightage: goal.weightage,
          status: goalStatusToDb[goal.status],
          isLocked: goal.locked,
          primaryOwner: Boolean(goal.primaryOwner),
        },
        create: {
          id: goal.id,
          employeeId: goal.employeeId,
          cycleId: cycle.id,
          sharedGoalId: goal.sharedGoalId ?? null,
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description,
          uomType: uomToDb[goal.uomType],
          direction: directionToDb[goal.direction],
          targetValue: goal.targetValue,
          targetDate: new Date(goal.targetDate),
          weightage: goal.weightage,
          status: goalStatusToDb[goal.status],
          isLocked: goal.locked,
          primaryOwner: Boolean(goal.primaryOwner),
        },
      });
    }

    for (const update of state.updates) {
      await tx.quarterlyUpdate.upsert({
        where: { goalId_quarter: { goalId: update.goalId, quarter: update.quarter } },
        update: {
          actualValue: update.actualValue,
          actualDate: new Date(update.actualDate),
          status: progressToDb[update.status],
          progressScore: update.progressScore,
          employeeComment: update.employeeComment,
        },
        create: {
          id: update.id,
          goalId: update.goalId,
          quarter: update.quarter,
          actualValue: update.actualValue,
          actualDate: new Date(update.actualDate),
          status: progressToDb[update.status],
          progressScore: update.progressScore,
          employeeComment: update.employeeComment,
        },
      });
    }

    for (const checkIn of state.checkIns) {
      await tx.checkIn.upsert({
        where: {
          employeeId_cycleId_quarter: {
            employeeId: checkIn.employeeId,
            cycleId: cycle.id,
            quarter: checkIn.quarter,
          },
        },
        update: {
          managerId: checkIn.managerId,
          comment: checkIn.comment,
          completedAt: new Date(checkIn.completedAt),
        },
        create: {
          id: checkIn.id,
          employeeId: checkIn.employeeId,
          managerId: checkIn.managerId,
          cycleId: cycle.id,
          quarter: checkIn.quarter,
          comment: checkIn.comment,
          completedAt: new Date(checkIn.completedAt),
        },
      });
    }

    for (const log of state.auditLogs) {
      const actor = state.users.find((user) => user.name === log.actor) ?? state.users[0];
      await tx.auditLog.upsert({
        where: { id: log.id },
        update: {
          actorId: actor.id,
          entityType: "DemoAction",
          entityId: log.entity,
          action: log.action,
          beforeJson: textToAuditJson(log.before),
          afterJson: textToAuditJson(log.after),
          createdAt: new Date(log.createdAt),
        },
        create: {
          id: log.id,
          actorId: actor.id,
          entityType: "DemoAction",
          entityId: log.entity,
          action: log.action,
          beforeJson: textToAuditJson(log.before),
          afterJson: textToAuditJson(log.after),
          createdAt: new Date(log.createdAt),
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
