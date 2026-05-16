-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CyclePhase" AS ENUM ('GOAL_SETTING', 'Q1_CHECK_IN', 'Q2_CHECK_IN', 'Q3_CHECK_IN', 'Q4_ANNUAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED');

-- CreateEnum
CREATE TYPE "UomType" AS ENUM ('NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('MIN', 'MAX');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'ON_TRACK', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT NOT NULL,
    "passwordHash" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "phase" "CyclePhase" NOT NULL,
    "goalSettingOpenDate" TIMESTAMP(3) NOT NULL,
    "q1OpenDate" TIMESTAMP(3) NOT NULL,
    "q2OpenDate" TIMESTAMP(3) NOT NULL,
    "q3OpenDate" TIMESTAMP(3) NOT NULL,
    "q4OpenDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalSubmission" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "managerComment" TEXT,

    CONSTRAINT "GoalSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedGoal" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "thrustArea" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "uomType" "UomType" NOT NULL,
    "direction" "Direction" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "sharedGoalId" TEXT,
    "thrustArea" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "uomType" "UomType" NOT NULL,
    "direction" "Direction" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "weightage" INTEGER NOT NULL,
    "status" "GoalStatus" NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "primaryOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyUpdate" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "actualDate" TIMESTAMP(3) NOT NULL,
    "status" "ProgressStatus" NOT NULL,
    "progressScore" INTEGER NOT NULL,
    "employeeComment" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterlyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "comment" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EscalationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSubmission_employeeId_cycleId_key" ON "GoalSubmission"("employeeId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyUpdate_goalId_quarter_key" ON "QuarterlyUpdate"("goalId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_employeeId_cycleId_quarter_key" ON "CheckIn"("employeeId", "cycleId", "quarter");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSubmission" ADD CONSTRAINT "GoalSubmission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSubmission" ADD CONSTRAINT "GoalSubmission_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedGoal" ADD CONSTRAINT "SharedGoal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedGoal" ADD CONSTRAINT "SharedGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_sharedGoalId_fkey" FOREIGN KEY ("sharedGoalId") REFERENCES "SharedGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterlyUpdate" ADD CONSTRAINT "QuarterlyUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
