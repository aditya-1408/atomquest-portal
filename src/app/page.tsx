"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  Unlock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Role = "Employee" | "Manager" | "Admin";
type UomType = "Numeric" | "Percentage" | "Timeline" | "Zero";
type Direction = "Min" | "Max";
type GoalStatus = "Draft" | "Submitted" | "Approved" | "Returned";
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
type ProgressStatus = "Not Started" | "On Track" | "Completed";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  managerId?: string;
};

type Goal = {
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
};

type Update = {
  id: string;
  goalId: string;
  quarter: Quarter;
  actualValue: number;
  actualDate: string;
  status: ProgressStatus;
  employeeComment: string;
  progressScore: number;
};

type CheckIn = {
  id: string;
  employeeId: string;
  managerId: string;
  quarter: Quarter;
  comment: string;
  completedAt: string;
};

type SharedGoal = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: UomType;
  direction: Direction;
  targetValue: number;
  targetDate: string;
};

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  before?: string;
  after?: string;
  createdAt: string;
};

type AppState = {
  users: User[];
  goals: Goal[];
  updates: Update[];
  checkIns: CheckIn[];
  sharedGoals: SharedGoal[];
  auditLogs: AuditLog[];
  cycle: {
    name: string;
    phase: string;
    windows: Record<string, string>;
  };
};

const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
const statuses: ProgressStatus[] = ["Not Started", "On Track", "Completed"];
const palette = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

const emptyGoal = (employeeId: string): Goal => ({
  id: crypto.randomUUID(),
  employeeId,
  thrustArea: "Business Growth",
  title: "",
  description: "",
  uomType: "Numeric",
  direction: "Min",
  targetValue: 100,
  targetDate: "2026-07-31",
  weightage: 10,
  status: "Draft",
  locked: false,
});

const seedState = (): AppState => {
  const users: User[] = [
    {
      id: "u-admin",
      name: "Ananya HR",
      email: "admin@atomquest.demo",
      role: "Admin",
      department: "People Success",
    },
    {
      id: "u-manager",
      name: "Rohan Mehta",
      email: "manager@atomquest.demo",
      role: "Manager",
      department: "Operations",
    },
    {
      id: "u-employee",
      name: "Priya Shah",
      email: "employee@atomquest.demo",
      role: "Employee",
      department: "Operations",
      managerId: "u-manager",
    },
    {
      id: "u-employee-2",
      name: "Karan Iyer",
      email: "employee2@atomquest.demo",
      role: "Employee",
      department: "Operations",
      managerId: "u-manager",
    },
  ];

  const goals: Goal[] = [
    {
      id: "g-1",
      employeeId: "u-employee",
      thrustArea: "Business Growth",
      title: "Improve service closure rate",
      description: "Increase first-time-right closures for assigned service tickets.",
      uomType: "Percentage",
      direction: "Min",
      targetValue: 92,
      targetDate: "2026-07-31",
      weightage: 40,
      status: "Approved",
      locked: true,
    },
    {
      id: "g-2",
      employeeId: "u-employee",
      thrustArea: "Customer Experience",
      title: "Reduce customer escalation TAT",
      description: "Lower average closure time for escalated requests.",
      uomType: "Numeric",
      direction: "Max",
      targetValue: 24,
      targetDate: "2026-07-31",
      weightage: 30,
      status: "Approved",
      locked: true,
    },
    {
      id: "g-3",
      employeeId: "u-employee",
      thrustArea: "Quality",
      title: "Maintain zero safety incidents",
      description: "Ensure process discipline and report unsafe conditions.",
      uomType: "Zero",
      direction: "Max",
      targetValue: 0,
      targetDate: "2026-07-31",
      weightage: 30,
      status: "Approved",
      locked: true,
    },
    {
      id: "g-4",
      employeeId: "u-employee-2",
      thrustArea: "Business Growth",
      title: "Launch dealer onboarding tracker",
      description: "Create and roll out a tracker for top-priority dealer onboarding.",
      uomType: "Timeline",
      direction: "Min",
      targetValue: 100,
      targetDate: "2026-07-31",
      weightage: 50,
      status: "Submitted",
      locked: false,
    },
    {
      id: "g-5",
      employeeId: "u-employee-2",
      thrustArea: "Customer Experience",
      title: "Improve monthly NPS follow-up coverage",
      description: "Call back detractors and close feedback loops within defined time.",
      uomType: "Percentage",
      direction: "Min",
      targetValue: 95,
      targetDate: "2026-07-31",
      weightage: 50,
      status: "Submitted",
      locked: false,
    },
  ];

  return {
    users,
    goals,
    updates: [
      {
        id: "up-1",
        goalId: "g-1",
        quarter: "Q1",
        actualValue: 86,
        actualDate: "2026-07-20",
        status: "On Track",
        employeeComment: "Process adherence improved; two complex cases are pending.",
        progressScore: 93,
      },
      {
        id: "up-2",
        goalId: "g-2",
        quarter: "Q1",
        actualValue: 28,
        actualDate: "2026-07-22",
        status: "On Track",
        employeeComment: "Need faster closure from field team.",
        progressScore: 86,
      },
    ],
    checkIns: [
      {
        id: "ci-1",
        employeeId: "u-employee",
        managerId: "u-manager",
        quarter: "Q1",
        comment: "Good progress. Prioritize escalation aging in the next sprint.",
        completedAt: "2026-07-25",
      },
    ],
    sharedGoals: [],
    auditLogs: [
      {
        id: "a-1",
        actor: "Rohan Mehta",
        action: "Approved and locked goal sheet",
        entity: "Priya Shah",
        createdAt: "2026-07-25T10:00:00.000Z",
      },
    ],
    cycle: {
      name: "FY 2026-27 Goal Cycle",
      phase: "Q1 Check-in",
      windows: {
        "Goal Setting": "Opens 1 May",
        "Q1 Check-in": "July",
        "Q2 Check-in": "October",
        "Q3 Check-in": "January",
        "Q4 / Annual": "March / April",
      },
    },
  };
};

function scoreGoal(goal: Goal, actualValue: number, actualDate: string) {
  if (goal.uomType === "Zero") return actualValue === 0 ? 100 : 0;
  if (goal.uomType === "Timeline") {
    return new Date(actualDate) <= new Date(goal.targetDate) ? 100 : 0;
  }
  if (goal.direction === "Min") return safeClamp((actualValue / goal.targetValue) * 100);
  if (actualValue === 0) return 100;
  return safeClamp((goal.targetValue / actualValue) * 100);
}

function safeClamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const [state, setState] = useState<AppState>(seedState);
  const [activeUserId, setActiveUserId] = useState("u-employee");
  const [view, setView] = useState("Dashboard");
  const [activeEmployeeId, setActiveEmployeeId] = useState("u-employee");
  const [quarter, setQuarter] = useState<Quarter>("Q1");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("atomquest-state");
      if (stored) setState(JSON.parse(stored));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("atomquest-state", JSON.stringify(state));
  }, [state]);

  const activeUser = state.users.find((user) => user.id === activeUserId)!;
  const employees = state.users.filter((user) => user.role === "Employee");
  const team = employees.filter((employee) => employee.managerId === activeUser.id);
  const selectedEmployee =
    state.users.find((user) => user.id === activeEmployeeId) ?? employees[0];
  const employeeGoals = state.goals.filter((goal) => goal.employeeId === selectedEmployee.id);
  const ownGoals = state.goals.filter((goal) => goal.employeeId === activeUser.id);
  const switchUser = (userId: string) => {
    const user = state.users.find((candidate) => candidate.id === userId)!;
    setActiveUserId(user.id);
    setView("Dashboard");
    if (user.role === "Employee") setActiveEmployeeId(user.id);
    if (user.role === "Manager") {
      const firstTeamMember = state.users.find(
        (candidate) => candidate.role === "Employee" && candidate.managerId === user.id,
      );
      if (firstTeamMember) setActiveEmployeeId(firstTeamMember.id);
    }
  };

  const nav = useMemo(() => {
    if (activeUser.role === "Employee") return ["Dashboard", "Goals", "Quarterly Update"];
    if (activeUser.role === "Manager")
      return ["Dashboard", "Approvals", "Check-ins", "Shared Goals"];
    return ["Dashboard", "Users & Cycles", "Reports", "Audit Trail"];
  }, [activeUser.role]);

  const setAndAudit = (updater: (current: AppState) => AppState) => {
    setState((current) => updater(current));
  };

  const addAudit = (current: AppState, action: string, entity: string, before?: string, after?: string) => ({
    ...current,
    auditLogs: [
      {
        id: crypto.randomUUID(),
        actor: activeUser.name,
        action,
        entity,
        before,
        after,
        createdAt: new Date().toISOString(),
      },
      ...current.auditLogs,
    ],
  });

  const updateGoal = (goalId: string, patch: Partial<Goal>) => {
    setAndAudit((current) => ({
      ...current,
      goals: current.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)),
    }));
  };

  const validation = validateGoals(ownGoals);

  const submitGoals = () => {
    if (!validation.ok) return;
    setAndAudit((current) =>
      addAudit(
        {
          ...current,
          goals: current.goals.map((goal) =>
            goal.employeeId === activeUser.id ? { ...goal, status: "Submitted" } : goal,
          ),
        },
        "Submitted goal sheet",
        activeUser.name,
      ),
    );
  };

  const approveGoals = () => {
    setAndAudit((current) =>
      addAudit(
        {
          ...current,
          goals: current.goals.map((goal) =>
            goal.employeeId === selectedEmployee.id
              ? { ...goal, status: "Approved", locked: true }
              : goal,
          ),
        },
        "Approved and locked goal sheet",
        selectedEmployee.name,
      ),
    );
  };

  const returnGoals = (comment: string) => {
    setAndAudit((current) =>
      addAudit(
        {
          ...current,
          goals: current.goals.map((goal) =>
            goal.employeeId === selectedEmployee.id
              ? { ...goal, status: "Returned", locked: false }
              : goal,
          ),
        },
        "Returned goal sheet for rework",
        selectedEmployee.name,
        undefined,
        comment.trim() || "No manager comment provided",
      ),
    );
  };

  const unlockEmployee = (employeeId: string) => {
    const employee = state.users.find((user) => user.id === employeeId);
    setAndAudit((current) =>
      addAudit(
        {
          ...current,
          goals: current.goals.map((goal) =>
            goal.employeeId === employeeId ? { ...goal, locked: false, status: "Returned" } : goal,
          ),
        },
        "Admin unlocked goal sheet",
        employee?.name ?? employeeId,
      ),
    );
  };

  const saveUpdate = (goal: Goal, actualValue: number, actualDate: string, status: ProgressStatus, comment: string) => {
    const progressScore = scoreGoal(goal, actualValue, actualDate);
    setAndAudit((current) => {
      const existing = current.updates.find(
        (update) => update.goalId === goal.id && update.quarter === quarter,
      );
      const nextUpdate: Update = {
        id: existing?.id ?? crypto.randomUUID(),
        goalId: goal.id,
        quarter,
        actualValue,
        actualDate,
        status,
        employeeComment: comment,
        progressScore,
      };
      const linkedGoalIds =
        goal.sharedGoalId && goal.primaryOwner
          ? current.goals
              .filter((candidate) => candidate.sharedGoalId === goal.sharedGoalId)
              .map((candidate) => candidate.id)
          : [goal.id];
      const withoutLinked = current.updates.filter(
        (update) => !(linkedGoalIds.includes(update.goalId) && update.quarter === quarter),
      );
      const linkedUpdates = linkedGoalIds.map((goalId) => ({
        ...nextUpdate,
        id: goalId === goal.id ? nextUpdate.id : crypto.randomUUID(),
        goalId,
      }));
      return addAudit(
        { ...current, updates: [...withoutLinked, ...linkedUpdates] },
        goal.sharedGoalId && goal.primaryOwner
          ? "Updated shared goal achievement and synced recipients"
          : "Updated quarterly achievement",
        goal.title,
      );
    });
  };

  const completeCheckIn = (comment: string) => {
    setAndAudit((current) => {
      const others = current.checkIns.filter(
        (checkIn) => !(checkIn.employeeId === selectedEmployee.id && checkIn.quarter === quarter),
      );
      return addAudit(
        {
          ...current,
          checkIns: [
            ...others,
            {
              id: crypto.randomUUID(),
              employeeId: selectedEmployee.id,
              managerId: activeUser.id,
              quarter,
              comment,
              completedAt: new Date().toISOString().slice(0, 10),
            },
          ],
        },
        "Completed manager check-in",
        `${selectedEmployee.name} ${quarter}`,
      );
    });
  };

  const pushSharedGoal = () => {
    const teamIds = team.map((member) => member.id);
    const shared: SharedGoal = {
      id: crypto.randomUUID(),
      ownerId: teamIds[0] ?? "u-employee",
      thrustArea: "Department KPI",
      title: "Department service SLA compliance",
      description: "Maintain SLA adherence across all assigned operational queues.",
      uomType: "Percentage",
      direction: "Min",
      targetValue: 95,
      targetDate: "2026-07-31",
    };
    const linkedGoals: Goal[] = teamIds.map((employeeId, index) => ({
      id: crypto.randomUUID(),
      employeeId,
      thrustArea: shared.thrustArea,
      title: shared.title,
      description: shared.description,
      uomType: shared.uomType,
      direction: shared.direction,
      targetValue: shared.targetValue,
      targetDate: shared.targetDate,
      weightage: 10,
      status: "Draft",
      locked: false,
      sharedGoalId: shared.id,
      primaryOwner: index === 0,
    }));
    setAndAudit((current) =>
      addAudit(
        {
          ...current,
          sharedGoals: [...current.sharedGoals, shared],
          goals: [...current.goals, ...linkedGoals],
        },
        "Pushed shared departmental KPI",
        "Operations team",
      ),
    );
  };

  const resetDemo = () => {
    const seeded = seedState();
    setState(seeded);
    localStorage.setItem("atomquest-state", JSON.stringify(seeded));
  };

  const exportCsv = () => {
    const rows = [
      [
        "Employee",
        "Manager",
        "Department",
        "Goal",
        "Thrust Area",
        "UoM",
        "Target",
        "Weightage",
        "Quarter",
        "Actual",
        "Status",
        "Progress Score",
      ],
      ...state.goals.flatMap((goal) => {
        const employee = state.users.find((user) => user.id === goal.employeeId);
        const manager = state.users.find((user) => user.id === employee?.managerId);
        const updates = state.updates.filter((update) => update.goalId === goal.id);
        const source = updates.length ? updates : [{ quarter: "", actualValue: "", status: "", progressScore: "" }];
        return source.map((update) => [
          employee?.name ?? "",
          manager?.name ?? "",
          employee?.department ?? "",
          goal.title,
          goal.thrustArea,
          goal.uomType,
          goal.uomType === "Timeline" ? goal.targetDate : goal.targetValue,
          goal.weightage,
          update.quarter,
          update.actualValue,
          update.status,
          update.progressScore,
        ]);
      }),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atomquest-achievement-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">AtomQuest 1.0</p>
            <h1 className="text-xl font-semibold">Goal Setting & Tracking Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="persona-switcher">
              {state.users.map((user) => (
                <button
                  key={user.id}
                  className={classNames("persona-button", activeUserId === user.id && "persona-button-active")}
                  onClick={() => switchUser(user.id)}
                  title={user.email}
                >
                  {user.role === "Employee" ? user.name.split(" ")[0] : user.role}
                </button>
              ))}
            </div>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={activeUserId}
              onChange={(event) => switchUser(event.target.value)}
              onInput={(event) => switchUser(event.currentTarget.value)}
            >
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.role}: {user.name}
                </option>
              ))}
            </select>
            <button className="icon-button" onClick={resetDemo} title="Reset seeded demo data">
              <RotateCcw size={18} />
            </button>
            <button className="icon-button" title="Demo logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit border-r border-slate-200 bg-white p-3 lg:min-h-[calc(100vh-112px)]">
          <div className="mb-4 rounded-md border border-slate-200 p-3">
            <p className="text-sm font-semibold">{activeUser.name}</p>
            <p className="text-xs text-slate-500">{activeUser.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {activeUser.role}
            </span>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <button
                key={item}
                className={classNames("nav-button", view === item && "nav-button-active")}
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="space-y-5">
          {view === "Dashboard" && (
            <Dashboard
              state={state}
              activeUser={activeUser}
              selectedEmployee={selectedEmployee}
              setView={setView}
              exportCsv={exportCsv}
            />
          )}

          {activeUser.role === "Employee" && view === "Goals" && (
            <EmployeeGoals
              goals={ownGoals}
              validation={validation}
              updateGoal={updateGoal}
              addGoal={() =>
                setState((current) => ({
                  ...current,
                  goals: [...current.goals, emptyGoal(activeUser.id)],
                }))
              }
              removeGoal={(goalId) =>
                setState((current) => ({
                  ...current,
                  goals: current.goals.filter((goal) => goal.id !== goalId),
                }))
              }
              submitGoals={submitGoals}
            />
          )}

          {activeUser.role === "Employee" && view === "Quarterly Update" && (
            <QuarterlyUpdate
              goals={ownGoals.filter((goal) => goal.status === "Approved")}
              updates={state.updates}
              quarter={quarter}
              setQuarter={setQuarter}
              saveUpdate={saveUpdate}
            />
          )}

          {activeUser.role === "Manager" && view === "Approvals" && (
            <ManagerApprovals
              team={team}
              selectedEmployee={selectedEmployee}
              setActiveEmployeeId={setActiveEmployeeId}
              goals={employeeGoals}
              updateGoal={updateGoal}
              approveGoals={approveGoals}
              returnGoals={returnGoals}
            />
          )}

          {activeUser.role === "Manager" && view === "Check-ins" && (
            <ManagerCheckIns
              team={team}
              selectedEmployee={selectedEmployee}
              setActiveEmployeeId={setActiveEmployeeId}
              goals={employeeGoals}
              updates={state.updates}
              checkIns={state.checkIns}
              quarter={quarter}
              setQuarter={setQuarter}
              completeCheckIn={completeCheckIn}
            />
          )}

          {activeUser.role === "Manager" && view === "Shared Goals" && (
            <SharedGoals state={state} team={team} pushSharedGoal={pushSharedGoal} />
          )}

          {activeUser.role === "Admin" && view === "Users & Cycles" && (
            <AdminUsers state={state} unlockEmployee={unlockEmployee} />
          )}

          {activeUser.role === "Admin" && view === "Reports" && (
            <AdminReports state={state} exportCsv={exportCsv} />
          )}

          {activeUser.role === "Admin" && view === "Audit Trail" && (
            <AuditTrail logs={state.auditLogs} />
          )}
        </section>
      </div>
    </main>
  );
}

function validateGoals(goals: Goal[]) {
  const total = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
  const messages = [];
  if (goals.length === 0) messages.push("Add at least one goal.");
  if (goals.length > 8) messages.push("Maximum 8 goals allowed.");
  if (goals.some((goal) => Number(goal.weightage) < 10)) messages.push("Each goal must have at least 10% weightage.");
  if (goals.some((goal) => Number(goal.weightage) > 100)) messages.push("Individual goal weightage cannot exceed 100%.");
  if (goals.some((goal) => Number(goal.weightage) <= 0)) messages.push("Goal weightage must be a positive number.");
  if (total !== 100) messages.push(`Total weightage must equal 100%. Current total: ${total}%.`);
  if (goals.some((goal) => !goal.title.trim())) messages.push("Every goal needs a title.");
  return { ok: messages.length === 0, messages, total };
}

function Dashboard({
  state,
  activeUser,
  setView,
  exportCsv,
}: {
  state: AppState;
  activeUser: User;
  selectedEmployee: User;
  setView: (view: string) => void;
  exportCsv: () => void;
}) {
  const employees = state.users.filter((user) => user.role === "Employee");
  const approved = employees.filter((employee) =>
    state.goals.some((goal) => goal.employeeId === employee.id && goal.status === "Approved"),
  ).length;
  const submitted = employees.filter((employee) =>
    state.goals.some((goal) => goal.employeeId === employee.id && goal.status === "Submitted"),
  ).length;
  const avgScore =
    state.updates.length === 0
      ? 0
      : Math.round(state.updates.reduce((sum, update) => sum + update.progressScore, 0) / state.updates.length);

  const chartData = employees.map((employee) => ({
    name: employee.name.split(" ")[0],
    goals: state.goals.filter((goal) => goal.employeeId === employee.id).length,
    checkIns: state.checkIns.filter((checkIn) => checkIn.employeeId === employee.id).length,
  }));

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{state.cycle.name}</p>
          <h2>{activeUser.role} Dashboard</h2>
          <p className="muted">Current phase: {state.cycle.phase}</p>
        </div>
        {activeUser.role === "Admin" && (
          <button className="primary-button" onClick={exportCsv}>
            <Download size={17} /> Export report
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<ClipboardList size={19} />} label="Employees" value={employees.length} />
        <Metric icon={<CheckCircle2 size={19} />} label="Approved sheets" value={approved} />
        <Metric icon={<Send size={19} />} label="Pending approval" value={submitted} />
        <Metric icon={<BarChart3 size={19} />} label="Avg progress" value={`${avgScore}%`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Completion Overview">
          <div className="chart-bars">
            {chartData.map((row) => (
              <div className="chart-row" key={row.name}>
                <span>{row.name}</span>
                <div className="bar-track">
                  <div className="bar-fill-blue" style={{ width: `${Math.min(row.goals * 28, 100)}%` }} />
                </div>
                <div className="bar-track">
                  <div className="bar-fill-green" style={{ width: `${Math.min(row.checkIns * 45, 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="chart-legend">
              <span><i className="legend-blue" /> Goals</span>
              <span><i className="legend-green" /> Check-ins</span>
            </div>
          </div>
        </Panel>
        <Panel title="Quarterly Windows">
          <div className="space-y-3">
            {Object.entries(state.cycle.windows).map(([name, window]) => (
              <div key={name} className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-medium">{name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{window}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Suggested Demo Path">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Employee", "Create goals, show validations, submit.", "Goals"],
            ["Manager", "Review, edit target/weightage, approve.", "Approvals"],
            ["Admin", "Export report and inspect audit log.", "Reports"],
          ].map(([role, text, target]) => (
            <button key={role} className="text-card text-left" onClick={() => setView(target)}>
              <p className="font-semibold">{role}</p>
              <p className="text-sm text-slate-600">{text}</p>
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}

function EmployeeGoals({
  goals,
  validation,
  updateGoal,
  addGoal,
  removeGoal,
  submitGoals,
}: {
  goals: Goal[];
  validation: ReturnType<typeof validateGoals>;
  updateGoal: (goalId: string, patch: Partial<Goal>) => void;
  addGoal: () => void;
  removeGoal: (goalId: string) => void;
  submitGoals: () => void;
}) {
  const sheetEditable = goals.every((goal) => goal.status === "Draft" || goal.status === "Returned");
  const canSubmit = validation.ok && goals.length > 0 && sheetEditable;

  return (
    <Panel
      title="Goal Sheet"
      actions={
        <>
          <button className="secondary-button" onClick={addGoal} disabled={!sheetEditable || goals.length >= 8}>
            <Plus size={17} /> Add goal
          </button>
          <button className="primary-button" onClick={submitGoals} disabled={!canSubmit}>
            <Send size={17} /> Submit
          </button>
        </>
      }
    >
      <ValidationBox validation={validation} />
      {!sheetEditable && (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          This sheet is waiting for manager action or already locked, so employee edits are paused.
        </div>
      )}
      <div className="space-y-4">
        {goals.map((goal) => {
          const canEditGoal = !goal.locked && (goal.status === "Draft" || goal.status === "Returned");
          const readOnly = !canEditGoal || Boolean(goal.sharedGoalId);
          return (
            <div key={goal.id} className="goal-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="status-badge">{goal.status}</span>
                  {goal.locked && <span className="ml-2 status-badge"><Lock size={12} /> Locked</span>}
                  {goal.sharedGoalId && <span className="ml-2 status-badge"><Share2 size={12} /> Shared KPI</span>}
                </div>
                <button className="icon-button" disabled={!canEditGoal || Boolean(goal.sharedGoalId)} onClick={() => removeGoal(goal.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid mt-4">
                <Field label="Thrust Area">
                  <input value={goal.thrustArea} disabled={readOnly} onChange={(e) => updateGoal(goal.id, { thrustArea: e.target.value })} />
                </Field>
                <Field label="Goal Title">
                  <input value={goal.title} disabled={readOnly} onChange={(e) => updateGoal(goal.id, { title: e.target.value })} />
                </Field>
                <Field label="Description">
                  <textarea value={goal.description} disabled={readOnly} onChange={(e) => updateGoal(goal.id, { description: e.target.value })} />
                </Field>
                <Field label="UoM">
                  <select value={goal.uomType} disabled={readOnly} onChange={(e) => updateGoal(goal.id, { uomType: e.target.value as UomType })}>
                    <option>Numeric</option>
                    <option>Percentage</option>
                    <option>Timeline</option>
                    <option>Zero</option>
                  </select>
                </Field>
                <Field label="Direction">
                  <select value={goal.direction} disabled={readOnly || goal.uomType === "Zero"} onChange={(e) => updateGoal(goal.id, { direction: e.target.value as Direction })}>
                    <option value="Min">Higher is better</option>
                    <option value="Max">Lower is better</option>
                  </select>
                </Field>
                <Field label="Target">
                  <input type="number" value={goal.targetValue} disabled={readOnly || goal.uomType === "Timeline" || goal.uomType === "Zero"} onChange={(e) => updateGoal(goal.id, { targetValue: Number(e.target.value) })} />
                </Field>
                <Field label="Deadline">
                  <input type="date" value={goal.targetDate} disabled={readOnly} onChange={(e) => updateGoal(goal.id, { targetDate: e.target.value })} />
                </Field>
                <Field label="Weightage">
                  <input type="number" min={10} max={100} value={goal.weightage} disabled={!canEditGoal} onChange={(e) => updateGoal(goal.id, { weightage: Number(e.target.value) })} />
                </Field>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function QuarterlyUpdate({
  goals,
  updates,
  quarter,
  setQuarter,
  saveUpdate,
}: {
  goals: Goal[];
  updates: Update[];
  quarter: Quarter;
  setQuarter: (quarter: Quarter) => void;
  saveUpdate: (goal: Goal, actualValue: number, actualDate: string, status: ProgressStatus, comment: string) => void;
}) {
  return (
    <Panel title="Quarterly Achievement Update" actions={<QuarterSelect quarter={quarter} setQuarter={setQuarter} />}>
      <div className="space-y-4">
        {goals.map((goal) => (
          <UpdateRow key={goal.id} goal={goal} existing={updates.find((update) => update.goalId === goal.id && update.quarter === quarter)} saveUpdate={saveUpdate} />
        ))}
        {goals.length === 0 && <Empty text="No approved goals yet. Ask the manager to approve the sheet first." />}
      </div>
    </Panel>
  );
}

function UpdateRow({
  goal,
  existing,
  saveUpdate,
}: {
  goal: Goal;
  existing?: Update;
  saveUpdate: (goal: Goal, actualValue: number, actualDate: string, status: ProgressStatus, comment: string) => void;
}) {
  const [actualValue, setActualValue] = useState(existing?.actualValue ?? 0);
  const [actualDate, setActualDate] = useState(existing?.actualDate ?? "2026-07-20");
  const [status, setStatus] = useState<ProgressStatus>(existing?.status ?? "On Track");
  const [comment, setComment] = useState(existing?.employeeComment ?? "");
  const score = scoreGoal(goal, Number(actualValue), actualDate);

  return (
    <div className="goal-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{goal.title}</h3>
          <p className="text-sm text-slate-600">Target: {goal.uomType === "Timeline" ? goal.targetDate : goal.targetValue} | Weightage: {goal.weightage}%</p>
        </div>
        <span className="score-pill">{score}% progress</span>
      </div>
      <div className="form-grid mt-4">
        <Field label="Actual Achievement">
          <input type="number" value={actualValue} onChange={(e) => setActualValue(Number(e.target.value))} />
        </Field>
        <Field label="Actual Date">
          <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as ProgressStatus)}>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Comment">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
      </div>
      <button className="primary-button mt-4" onClick={() => saveUpdate(goal, Number(actualValue), actualDate, status, comment)}>
        <CheckCircle2 size={17} /> Save update
      </button>
    </div>
  );
}

function ManagerApprovals(props: {
  team: User[];
  selectedEmployee: User;
  setActiveEmployeeId: (id: string) => void;
  goals: Goal[];
  updateGoal: (goalId: string, patch: Partial<Goal>) => void;
  approveGoals: () => void;
  returnGoals: (comment: string) => void;
}) {
  const validation = validateGoals(props.goals);
  const [returnComment, setReturnComment] = useState("");
  const canReview = props.goals.some((goal) => goal.status === "Submitted" || goal.status === "Returned");
  return (
    <Panel
      title="L1 Goal Approval"
      actions={<EmployeeSelect team={props.team} value={props.selectedEmployee.id} onChange={props.setActiveEmployeeId} />}
    >
      <ValidationBox validation={validation} />
      <div className="space-y-3">
        {props.goals.map((goal) => (
          <div key={goal.id} className="goal-card">
            <div className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
              <div>
                <p className="font-semibold">{goal.title}</p>
                <p className="text-sm text-slate-600">{goal.description}</p>
                <span className="status-badge mt-2">{goal.status}</span>
              </div>
              <Field label="Target">
                <input type="number" value={goal.targetValue} disabled={!canReview || goal.locked || goal.uomType === "Timeline"} onChange={(e) => props.updateGoal(goal.id, { targetValue: Number(e.target.value) })} />
              </Field>
              <Field label="Weightage">
                <input type="number" min={10} max={100} value={goal.weightage} disabled={!canReview || goal.locked} onChange={(e) => props.updateGoal(goal.id, { weightage: Number(e.target.value) })} />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <Field label="Return Comment">
        <textarea value={returnComment} onChange={(e) => setReturnComment(e.target.value)} placeholder="Reason for rework, expected changes, and next action..." />
      </Field>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="primary-button" disabled={!validation.ok || !canReview} onClick={props.approveGoals}><ShieldCheck size={17} /> Approve & lock</button>
        <button className="secondary-button" disabled={!canReview || returnComment.trim().length === 0} onClick={() => props.returnGoals(returnComment)}><RotateCcw size={17} /> Return for rework</button>
      </div>
    </Panel>
  );
}

function ManagerCheckIns(props: {
  team: User[];
  selectedEmployee: User;
  setActiveEmployeeId: (id: string) => void;
  goals: Goal[];
  updates: Update[];
  checkIns: CheckIn[];
  quarter: Quarter;
  setQuarter: (quarter: Quarter) => void;
  completeCheckIn: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const existing = props.checkIns.find((checkIn) => checkIn.employeeId === props.selectedEmployee.id && checkIn.quarter === props.quarter);

  return (
    <Panel
      title="Manager Check-in"
      actions={
        <div className="flex gap-2">
          <EmployeeSelect team={props.team} value={props.selectedEmployee.id} onChange={props.setActiveEmployeeId} />
          <QuarterSelect quarter={props.quarter} setQuarter={props.setQuarter} />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Goal</th><th>Planned</th><th>Actual</th><th>Status</th><th>Progress</th></tr></thead>
          <tbody>
            {props.goals.map((goal) => {
              const update = props.updates.find((item) => item.goalId === goal.id && item.quarter === props.quarter);
              return (
                <tr key={goal.id}>
                  <td>{goal.title}</td>
                  <td>{goal.uomType === "Timeline" ? goal.targetDate : goal.targetValue}</td>
                  <td>{update?.actualValue ?? "Pending"}</td>
                  <td>{update?.status ?? "Not updated"}</td>
                  <td>{update ? `${update.progressScore}%` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Field label="Structured Check-in Comment">
        <textarea value={comment || existing?.comment || ""} onChange={(e) => setComment(e.target.value)} placeholder="Discussion summary, blockers, next actions..." />
      </Field>
      <button className="primary-button mt-4" onClick={() => props.completeCheckIn(comment || existing?.comment || "")}>
        <MessageSquare size={17} /> Complete check-in
      </button>
    </Panel>
  );
}

function SharedGoals({ state, team, pushSharedGoal }: { state: AppState; team: User[]; pushSharedGoal: () => void }) {
  return (
    <Panel
      title="Shared Departmental Goals"
      actions={<button className="primary-button" onClick={pushSharedGoal}><Share2 size={17} /> Push KPI to team</button>}
    >
      <p className="mb-4 text-sm text-slate-600">Shared goal title and target stay read-only for recipients; only weightage remains adjustable.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {state.sharedGoals.map((goal) => (
          <div className="text-card" key={goal.id}>
            <p className="font-semibold">{goal.title}</p>
            <p className="text-sm text-slate-600">{goal.description}</p>
            <p className="mt-2 text-xs text-slate-500">Target {goal.targetValue}% | Recipients {team.length}</p>
          </div>
        ))}
        {state.sharedGoals.length === 0 && <Empty text="No shared KPIs yet. Push one for the demo." />}
      </div>
    </Panel>
  );
}

function AdminUsers({ state, unlockEmployee }: { state: AppState; unlockEmployee: (id: string) => void }) {
  const employees = state.users.filter((user) => user.role === "Employee");
  return (
    <Panel title="Users, Hierarchy & Cycle">
      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {Object.entries(state.cycle.windows).map(([name, value]) => (
          <div key={name} className="text-card">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-slate-500">{value}</p>
          </div>
        ))}
      </div>
      <table>
        <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Manager</th><th>Exception</th></tr></thead>
        <tbody>
          {employees.map((employee) => {
            const manager = state.users.find((user) => user.id === employee.managerId);
            return (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.role}</td>
                <td>{employee.department}</td>
                <td>{manager?.name}</td>
                <td><button className="secondary-button" onClick={() => unlockEmployee(employee.id)}><Unlock size={16} /> Unlock</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function AdminReports({ state, exportCsv }: { state: AppState; exportCsv: () => void }) {
  const byThrust = Object.values(
    state.goals.reduce<Record<string, { name: string; value: number }>>((acc, goal) => {
      acc[goal.thrustArea] = acc[goal.thrustArea] ?? { name: goal.thrustArea, value: 0 };
      acc[goal.thrustArea].value += 1;
      return acc;
    }, {}),
  );
  const checkInRows = state.users.filter((user) => user.role === "Employee").map((employee) => ({
    name: employee.name,
    completed: state.checkIns.filter((checkIn) => checkIn.employeeId === employee.id).length,
  }));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Achievement Report" actions={<button className="primary-button" onClick={exportCsv}><Download size={17} /> CSV</button>}>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Employee</th><th>Goal</th><th>Actuals</th><th>Score</th></tr></thead>
            <tbody>
              {state.goals.map((goal) => {
                const employee = state.users.find((user) => user.id === goal.employeeId);
                const updates = state.updates.filter((update) => update.goalId === goal.id);
                return <tr key={goal.id}><td>{employee?.name}</td><td>{goal.title}</td><td>{updates.length}</td><td>{updates[0]?.progressScore ?? "-"} </td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Goal Distribution">
        <div className="space-y-3">
          {byThrust.map((item, index) => (
            <div className="distribution-row" key={item.name}>
              <span className="distribution-dot" style={{ background: palette[index % palette.length] }} />
              <span className="flex-1">{item.name}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Check-in Completion">
        <div className="chart-bars">
          {checkInRows.map((row) => (
            <div className="chart-row" key={row.name}>
              <span>{row.name}</span>
              <div className="bar-track wide">
                <div className="bar-fill-green" style={{ width: `${Math.min(row.completed * 45, 100)}%` }} />
              </div>
              <strong>{row.completed}</strong>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Escalation Preview">
        <div className="space-y-3">
          <div className="alert"><AlertTriangle size={17} /> Karan Iyer has a submitted sheet pending manager approval.</div>
          <div className="alert"><AlertTriangle size={17} /> Q1 check-in missing for one employee.</div>
        </div>
      </Panel>
    </div>
  );
}

function AuditTrail({ logs }: { logs: AuditLog[] }) {
  return (
    <Panel title="Audit Trail">
      <table>
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.actor}</td>
              <td>{log.action}</td>
              <td>{log.entity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ValidationBox({ validation }: { validation: ReturnType<typeof validateGoals> }) {
  return (
    <div className={classNames("mb-4 rounded-md border p-3 text-sm", validation.ok ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900")}>
      {validation.ok ? (
        <span className="flex items-center gap-2"><CheckCircle2 size={16} /> BRD validations passed. Total weightage: {validation.total}%.</span>
      ) : (
        <ul className="list-inside list-disc space-y-1">
          {validation.messages.map((message) => <li key={message}>{message}</li>)}
        </ul>
      )}
    </div>
  );
}

function EmployeeSelect({ team, value, onChange }: { team: User[]; value: string; onChange: (id: string) => void }) {
  return (
    <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {team.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
    </select>
  );
}

function QuarterSelect({ quarter, setQuarter }: { quarter: Quarter; setQuarter: (quarter: Quarter) => void }) {
  return (
    <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={quarter} onChange={(e) => setQuarter(e.target.value as Quarter)}>
      {quarters.map((item) => <option key={item}>{item}</option>)}
    </select>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-500">{text}</div>;
}
