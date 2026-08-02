# Remote Work Tracker – Web Portal

Next.js admin/manager portal for the Remote Work Tracker platform. Org admins and managers use this app to oversee teams, projects, attendance, payroll, compliance, wellness, and AI-backed insights.

## Stack

- **Framework:** Next.js (App Router) + React 18 + TypeScript
- **Data:** TanStack React Query
- **UI:** CSS modules, Lucide icons, light/dark theme
- **API:** Portal backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`)

## Features

- Auth: sign-in / sign-up, password reset
- Dashboard: employees overview, activity timeline, rankings, wellness, AI insights
- Organization, users, roles, departments
- Projects, tasks, goals / OKRs, progress tracking
- Attendance, activity / desk telemetry
- Payroll, performance, compliance
- Learning, wellness mood logs, notifications, settings

## Prerequisites

- Node 18+
- Portal backend running locally or hosted

## Setup

```bash
cd web
cp .env.example .env.local
npm install
```

Set the API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For a hosted backend, use that origin instead (no trailing slash).

## Running

```bash
npm run dev      # http://localhost:3000
npm run build
npm start
npm run lint
npm test
```

## Project layout

| Path | Role |
|------|------|
| `src/app/(auth)/` | Sign-in, sign-up, password flows |
| `src/app/(main)/` | Authenticated portal pages |
| `src/components/` | Shared UI (shell, modals, tables, theme) |
| `src/services/` | API hooks and clients |
| `src/types/` | Shared TypeScript types |
| `src/styles/` | Global theme tokens |

## Related packages

| Package | Role |
|---------|------|
| `backend/` | Express + PostgreSQL API |
| `ai-server/` | AI ranking / insights service |
| `mobile/` | Employee Expo app |
| `agent/` | Desktop activity agent (Go) |
