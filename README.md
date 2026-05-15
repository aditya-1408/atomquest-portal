# AtomQuest Goal Setting & Tracking Portal

Hackathon submission for AtomQuest Hackathon 1.0: an in-house web portal for employee goal creation, L1 manager approval, quarterly achievement tracking, admin governance, reports, audit logs, and shared departmental KPIs.

## Live Demo Readiness

The app is built as a low-cost browser-first demo using Next.js and local browser persistence. It requires no paid infrastructure for the first hosted demo and can be deployed directly to Vercel.

For a production rollout, replace the local persistence layer with the database schema described in `ARCHITECTURE.md`.

## Demo Credentials

Use the persona buttons in the header or the role selector:

| Role | User | Email |
| --- | --- | --- |
| Admin / HR | Ananya HR | `admin@atomquest.demo` |
| Manager L1 | Rohan Mehta | `manager@atomquest.demo` |
| Employee | Priya Shah | `employee@atomquest.demo` |
| Employee | Karan Iyer | `employee2@atomquest.demo` |

## Implemented Features

- Employee dashboard.
- Employee goal sheet creation and editing.
- BRD validations:
  - Total weightage must equal 100%.
  - Minimum individual goal weightage is 10%.
  - Maximum 8 goals per employee.
- Goal submission workflow.
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
- Browser localStorage demo persistence

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

1. Start as Employee Priya.
   - Open Goals.
   - Show locked approved goals.
   - Open Quarterly Update.
   - Enter Q1 actuals and save.
2. Switch to Employee Karan.
   - Open Goals.
   - Show submitted editable sheet.
   - Demonstrate validation by changing weightage away from 100%.
3. Switch to Manager.
   - Open Approvals.
   - Select Karan.
   - Edit target or weightage inline.
   - Approve and lock.
4. Open Check-ins as Manager.
   - Select employee and quarter.
   - Review planned vs actual.
   - Add structured check-in comment.
5. Open Shared Goals as Manager.
   - Push departmental KPI.
   - Switch to an employee and show title/target read-only, weightage editable.
6. Switch to Admin.
   - Open Users & Cycles.
   - Show cycle windows and unlock exception.
   - Open Reports and export CSV.
   - Open Audit Trail.

## Deployment: Vercel

1. Push this folder to GitHub.
2. Go to Vercel and import the GitHub repository.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Output directory: leave default.
6. Environment variables: none required for the demo version.
7. Deploy.

## Production Upgrade Path

The demo uses local browser persistence for speed and cost optimization. For a production-grade version:

- Add PostgreSQL using Supabase, Neon, or Azure Database for PostgreSQL.
- Add Prisma models for users, cycles, goals, shared goals, updates, check-ins, audit logs, and escalation logs.
- Replace demo role switching with Microsoft Entra ID.
- Map manager hierarchy from Entra profile attributes or HRMS data.
- Add server-side authorization checks.
- Add real email or Microsoft Teams notifications using Microsoft Graph.

