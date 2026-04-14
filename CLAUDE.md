# DeepThink CodeArts CRM — AI Context File

## 🧠 Project Overview
This is a full-stack internal CRM, Task Management, and Invoice System built for **DeepThink CodeArts**, a digital agency. It is designed to be minimal, clean, extremely practical, and modular.

## 🛠 Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| UI Components | Custom (no heavy component libraries) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| State | Zustand (client state) |
| Notifications | Sonner (toast) |

## 📁 Project Structure
```
src/
  app/
    (auth)/login/          → Login page
    (dashboard)/           → All protected pages
      contacts/
      companies/
      leads/
      deals/
      projects/
      tasks/
      invoices/
      settings/
    api/                   → API route handlers
  components/
    ui/                    → Reusable base components (Button, Modal, Badge, etc.)
    layout/                → Sidebar, Header, PageWrapper
    modules/               → Module-specific components
  lib/                     → prisma.ts, auth.ts, utils.ts, validators/
  hooks/                   → Custom React hooks
  types/                   → TypeScript interfaces
prisma/
  schema.prisma            → Full database schema
docs/                      → Documentation
```

## 🧩 Core Modules
1. **Contacts** — People (clients, prospects). Linked to Companies.
2. **Companies** — Organization-level data.
3. **Leads** — Opportunities with nested Probable Deals.
4. **Deals** — Confirmed opportunities. Auto-created when Lead deal is marked Won.
5. **Projects** — Execution layer. Linked to Deals.
6. **Tasks** — Universal. Can be linked to any entity.
7. **Invoices** — Financial tracking. Manual or auto from payment schedules.

## 🔐 RBAC
- **Super Admin**: Full access, user management, role management.
- **Custom Roles**: Module-wise + action-level (CRUD) permissions defined by Super Admin.
- Permissions stored in DB, checked server-side on every API call.

## 🎨 Design Principles
- Color: Deep navy `#0A0F1E` background, white/slate text, electric blue `#3B82F6` accent
- Font: `Geist` (headings) + `Inter` (body)
- Cards: `bg-white/5 backdrop-blur border border-white/10 rounded-2xl`
- Minimal, zero bloat, dark theme primary
- Status colors: Green=Active, Red=Inactive, Yellow=Pending

## ⚙️ Key Rules for AI Assistants
- **Never break existing functionality** when adding features
- **Always update Prisma schema** before writing API routes
- **Use Zod** for all form/API validation
- **Server Components** by default; `"use client"` only when needed
- **All API routes** must check permissions via `checkPermission(session, module, action)`
- **Soft deletes** preferred (`deletedAt` timestamp) over hard deletes
- **Relational integrity**: always use Prisma relations, no raw foreign key strings

## 🔄 Automation Rules
- When a `ProbableDeal.stage` changes to `Won` → auto-create a `Deal`
- When a `Deal` is created → option to auto-create a `Project`
- Task deadlines trigger notification flags

## 📦 Environment Variables Required
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

## 🚀 Getting Started
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```
Seed the DB: `npx prisma db seed`
