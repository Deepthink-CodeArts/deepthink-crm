# 🚀 DeepThink CodeArts CRM

> An all-in-one CRM, Task Management, and Invoice System built for **DeepThink CodeArts** — a digital agency internal tool.

---

## ✨ Features

| Module | What it does |
|---|---|
| 👤 Contacts | Manage clients & prospects with status tracking |
| 🏢 Companies | Organization-level data, linked to contacts & leads |
| 🎯 Leads | Track opportunities with nested Probable Deals |
| 💰 Deals | Auto-created from won leads, with payment tracking |
| 🚀 Projects | Execution layer with team assignment & task mapping |
| ✅ Tasks | Kanban-style task board, linkable to any entity |
| 💳 Invoices | Line-item invoices with status management |
| 🔐 RBAC | Dynamic roles with module-level CRUD permissions |

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** NextAuth.js v5
- **Styling:** Tailwind CSS + CSS Variables
- **Notifications:** Sonner
- **Forms:** React Hook Form + Zod

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Supabase free tier](https://supabase.com))

### 2. Clone & Install
```bash
git clone <your-repo>
cd deepthink-crm
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your database URL and NextAuth secret
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default login:** `admin@deepthink.com` / `admin123`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/login/          → Login page
│   ├── (dashboard)/           → All protected pages
│   │   ├── dashboard/         → Home with stats
│   │   ├── contacts/          → Contacts CRUD
│   │   ├── companies/         → Companies CRUD
│   │   ├── leads/             → Leads + Probable Deals
│   │   ├── deals/             → Deals + Payments
│   │   ├── projects/          → Projects management
│   │   ├── tasks/             → Kanban task board
│   │   ├── invoices/          → Invoice generation
│   │   └── settings/          → Users & Roles RBAC
│   └── api/                   → REST API routes
├── components/
│   ├── layout/                → Sidebar, Header
│   └── ui/                    → Reusable components
├── lib/                       → prisma.ts, auth.ts, utils.ts
└── types/                     → TypeScript definitions
prisma/
├── schema.prisma              → Full DB schema
└── seed.ts                    → Initial data seeder
```

---

## 🔑 Key Automations

- **Lead → Deal:** When a Probable Deal is marked `Won`, a Deal is automatically created
- **Payment tracking:** `amountReceived` on Deals updates automatically with each payment
- **Invoice numbers:** Auto-generated in format `INV-YYYY-XXXX`

---

## 🔐 Default Roles

| Role | Access |
|---|---|
| Super Admin | Full access to everything |
| Agent | CRUD on CRM modules, no user/settings access |

---

## 🗄 Database Commands

```bash
npm run db:push      # Push schema to DB
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Seed initial data
npm run db:generate  # Regenerate Prisma client
```

---

## 🚢 Deployment (Free)

**Recommended free stack:**
- **App hosting:** [Vercel](https://vercel.com) (free tier)
- **Database:** [Supabase](https://supabase.com) (free tier PostgreSQL)

```bash
# Deploy to Vercel
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

---

## 📋 Future Enhancements

- [ ] Auto follow-up reminders
- [ ] Revenue analytics dashboard  
- [ ] AI assistant for summaries
- [ ] Email integration
- [ ] File upload for documents
- [ ] Mobile app

---

## 🤝 Built by

**DeepThink CodeArts** — Internal tool. Not for public distribution.
