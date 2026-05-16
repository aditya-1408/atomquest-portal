# AtomQuest Goal Setting & Tracking Portal

Hackathon submission for AtomQuest Hackathon 1.0: an in-house web portal for employee goal creation, L1 manager approval, quarterly achievement tracking, admin governance, reports, audit logs, and shared departmental KPIs.

## Live Demo Readiness

The app runs as a real database-backed Next.js portal on Vercel with Neon PostgreSQL, Prisma, password-based signup/login, signed HTTP-only sessions, role-scoped dashboards, and server-side API protection.

## Accounts

Create accounts from the Sign up tab. Managers and Admin/HR can sign up directly. Employees can sign up with an existing manager email to attach themselves to that L1 manager's team.

## Implemented Features

- Employee dashboard.
- Employee goal sheet creation and editing.
- BRD validations:
  - Total weightage must equal 100%.
  - Minimum individual goal weightage is 10%.
  - Maximum 8 goals per employee.
- Goal submission workflow.
- Admin-controlled cycle phase enforcement for Goal Setting and quarterly check-in windows.
- Manager L1 dashboard.
- Manager inline edit of target and weightage.
- Manager approve and lock flow.
- Manager return-for-rework flow.
- Quarterly achievement updates.
- Progress score formulas for Numeric, Percentage, Timeline, and Zero-based goals.
- Manager check-in comments.
- Admin users, hierarchy, and cycle window view.
- Admin unlock exception flow.
- Completion dashboard.
- CSV achievement report export.
- Audit trail.
- Shared departmental KPI push to team.
- Shared goal recipient restriction: title, target, UoM, and deadline are read-only; weightage remains editable.
- Shared goal primary owner achievement sync.
- Bonus-style analytics and escalation preview.

## Tech Stack

- Next.js 16
- TypeScript
- React
- Tailwind CSS
- lucide-react icons
- PostgreSQL via Neon
- Prisma ORM
- Signed HTTP-only session cookie auth

## Local Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```bash
npm run lint
npm run build
```

Both commands pass in the current workspace.

## Demo Script

1. Sign up as Admin/HR.
   - Open Users & Cycles.
   - Set active phase to Goal Setting.
2. Sign up as Manager.
   - Use the same department you want employees to join.
3. Sign up as Employee.
   - Enter the manager email during signup.
   - Open Goals, create goals, verify validation, and submit.
4. Log in as Manager.
   - Open Approvals.
   - Review the employee sheet, edit target or weightage inline, return for rework or approve and lock.
5. Log in as Admin/HR.
   - Move the active phase to Q1 Check-in.
6. Log in as Employee.
   - Open Quarterly Update.
   - Enter Q1 actual achievement and status.
7. Log in as Manager.
   - Open Check-ins.
   - Review planned vs actual and add a structured check-in comment.
8. Open Shared Goals as Manager or Admin/HR.
   - Push departmental KPI.
   - Confirm recipients can edit only weightage.
9. Log in as Admin/HR.
   - Open Reports and export CSV.
   - Open Audit Trail.

## Deployment: Vercel

1. Push this folder to GitHub.
2. Go to Vercel and import the GitHub repository.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Output directory: leave default.
6. Environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NEXTAUTH_SECRET` if you also want a NextAuth-compatible secret name
   - `NEXTAUTH_URL`
7. Deploy.

## Future Enterprise Upgrade Path

- Replace open signup with HR/admin-provisioned invitations or Microsoft Entra ID SSO.
- Map manager hierarchy from Entra profile attributes or HRMS data.
- Add real email or Microsoft Teams notifications using Microsoft Graph.
