# Architecture

## Current Architecture

```mermaid
flowchart LR
    E["Employee Browser"] --> UI["Next.js App on Vercel"]
    M["Manager Browser"] --> UI
    A["Admin / HR Browser"] --> UI
    UI --> API["Next.js API Routes"]
    API --> Auth["Signed HTTP-only Session Auth"]
    API --> DB["Neon PostgreSQL via Prisma"]
    UI --> CSV["CSV Achievement Export"]
    API --> Audit["Audit Log Table"]
    UI --> Dash["Completion and Analytics Dashboards"]
```

## Why This Architecture

- Hosted, browser-accessible, and cost-aware for hackathon judging.
- Uses Neon PostgreSQL so auth, goals, approvals, updates, check-ins, audit logs, and reports persist across sessions.
- Keeps role access scoped in the API: employees see their own data, managers see their team, and Admin/HR sees governance-wide data.
- Uses standard Vercel deployment with Prisma generation during install/build.
- Leaves Microsoft Entra and Teams integration as future enterprise modules unless tenant credentials are available.

## Environment

- `DATABASE_URL`: Neon PostgreSQL connection string.
- `SESSION_SECRET`: long random session-signing secret.
- `NEXTAUTH_SECRET`: optional compatible secret name.
- `NEXTAUTH_URL`: deployed Vercel URL.

## Production Architecture Upgrade

```mermaid
flowchart LR
    E["Employee"] --> Entra["Microsoft Entra ID SSO"]
    M["Manager L1"] --> Entra
    A["Admin / HR"] --> Entra
    Entra --> App["Next.js Web App on Vercel / Azure App Service"]
    App --> API["Server Actions / API Routes"]
    API --> DB["PostgreSQL: Neon / Azure DB"]
    API --> Audit["Audit Log Table"]
    API --> Reports["CSV / Excel Export Service"]
    API --> Rules["Escalation Rules Engine"]
    Rules --> Graph["Microsoft Graph"]
    Graph --> Email["Email Notifications"]
    Graph --> Teams["Teams Adaptive Cards"]
```

## Core Modules

| Module | Responsibility |
| --- | --- |
| Role shell | Employee, Manager, and Admin persona-specific navigation |
| Goal sheet | Goal CRUD, validation, submission, lock state |
| Approval workflow | L1 review, inline target/weightage edits, approval, return for rework |
| Shared goals | Department KPI push and linked achievement sync |
| Quarterly updates | Employee actual achievement entry and progress score calculation |
| Check-ins | Manager planned vs actual review and structured comments |
| Admin governance | Cycle windows, hierarchy view, unlock exceptions |
| Reporting | Achievement report CSV export |
| Audit trail | Who changed what and when |
| Analytics | Completion, distribution, and escalation preview |

## Production Database Tables

- `users`
- `cycles`
- `goals`
- `goal_submissions`
- `shared_goals`
- `quarterly_updates`
- `check_ins`
- `audit_logs`
- `escalation_logs`

## Cost Optimization

- Vercel free tier or low-cost serverless hosting for the Next.js app.
- Neon free tier PostgreSQL for hackathon-scale relational persistence.
- Single `/api/state` read endpoint loads the scoped user workspace in one request instead of many chatty calls.
- API responses are role-scoped: employees receive only their records, managers receive only team data, and Admin/HR receives governance data.
- Client saves are debounced to avoid writing to the database on every keystroke.
- Reports and CSV exports are generated on demand in the browser, avoiding scheduled workers or paid reporting services.
- Analytics and escalation modules are computed from existing goal/update/check-in records, so no extra infrastructure is required.
- Real Microsoft Entra, email, and Teams integrations are documented as future enterprise add-ons, avoiding credential complexity and paid external dependencies during judging.

## API Efficiency

- Authentication uses signed HTTP-only cookies and one session lookup per protected API request.
- Prisma queries in `GET /api/state` run in parallel for users, goals, updates, check-ins, shared goals, cycle, and audit logs.
- `POST /api/state` batches persistence inside a Prisma transaction.
- Role scoping reduces transferred data for employee and manager sessions.
- UI-only analytics avoids server-side chart aggregation jobs for the demo scale.
