# OpsFlow ERP

**Mini ERP + CRM Operations Portal** — a production-quality internal operations application for a wholesale/distribution company, used by Admin, Sales, Warehouse and Accounts teams.

![Stack](https://img.shields.io/badge/React-18-61dafb) ![JavaScript](https://img.shields.io/badge/JavaScript-plain-f7df1e) ![Node](https://img.shields.io/badge/Node.js-Express-339933) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791) ![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38bdf8)

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Database schema overview](#5-database-schema-overview)
6. [Local setup](#6-local-setup)
7. [Environment variables](#7-environment-variables)
8. [Database migration commands](#8-database-migration-commands)
9. [Seed commands](#9-seed-commands)
10. [Running frontend](#10-running-frontend)
11. [Running backend](#11-running-backend)
12. [API documentation](#12-api-documentation)
13. [Authentication](#13-authentication)
14. [Role permissions](#14-role-permissions)
15. [Business rules](#15-business-rules)
16. [Deployment instructions](#16-deployment-instructions)
17. [Demo credentials](#17-demo-credentials)
18. [Screenshots](#18-screenshots)
19. [Future improvements](#19-future-improvements)
20. [Changelog](#20-changelog)

---

## 1. Project overview

OpsFlow ERP is a full-stack operations portal for a wholesale/distribution business. It covers the complete money-to-stock journey:

**Login → Dashboard → Create Customer → Create Product → Add Stock → Create Draft Challan → Confirm Challan → Validate Stock → Deduct Stock → Create OUT Stock Movement → View Updated Inventory → View Confirmed Challan**

The application demonstrates: REST API design, database design with Prisma/PostgreSQL, JWT authentication with role-based authorization, transactional business logic, input validation on both ends, a responsive admin dashboard, inventory management and CRM functionality.

## 2. Features

- **Authentication** — JWT login, bcrypt password hashing, `GET /api/auth/me`, sticky sessions via token.
- **Role-based access (ADMIN / SALES / WAREHOUSE / ACCOUNTS)** — enforced on backend APIs *and* mirrored in the frontend (routes, sidebar, buttons).
- **Dashboard** — stat cards (customers, products, stock, challans), donut charts for challan/customer status, 6-month stock movement chart, recent customers/challans/stock movements and low-stock alerts.
- **Customer CRM** — full CRUD, search, filter by type/status, pagination, follow-up notes with history, and per-customer challan history.
- **Products & Inventory** — product CRUD with unique SKU, category filter, search, low-stock warnings (`currentStock <= minimumStock`), stock levels with progress bars.
- **Stock movements** — every stock change records `IN`/`OUT` with reason and actor inside a DB transaction; stock can never go negative.
- **Sales challans** — multi-product challan editor with live line totals, auto-generated unique numbers (`CH-2026-000001`), snapshot of product name/SKU/price at creation, DRAFT → CONFIRMED workflow, atomic stock deduction on confirmation, and invalid-status-transition protection.
- **Users (Admin)** — team directory with per-user activity counts.
- **Responsive UI** — collapsible sidebar, horizontally scrollable tables, Tailwind CSS, toasts, modals, confirmation dialogs, loading and empty states.

## 3. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, JavaScript (plain JS, no TypeScript), Vite, React Router 7, Tailwind CSS 4, Axios, React Hook Form, Zod, Lucide icons |
| Backend | Node.js, Express 4, TypeScript (strict), JWT (jsonwebtoken), bcryptjs, Zod validation |
| Database | PostgreSQL, Prisma ORM 6 |
| Testing | Vitest + Supertest (backend, 40 tests) |
| Deployment | Frontend: Vercel / Netlify · Backend: Render / Railway · DB: Neon / Supabase |

> The frontend is intentionally written in plain JavaScript (`.jsx`) so it is easy to read
> and edit without TypeScript knowledge. The backend API remains TypeScript.

## 4. Architecture

```
opsflow-erp/
├── frontend/                         # React + Vite frontend
│   └── src/
│       ├── components/              # ui/, layout/, guards/, charts/
│       ├── context/                 # AuthContext, ToastContext
│       ├── pages/                   # customers/, products/, challans/, stock/, inventory/
│       ├── services/                # JavaScript API service layer over Axios
│       └── utils/                   # formatting + shared constants
└── backend/                          # Express API
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.ts
    │   └── migrations/
    ├── src/
    │   ├── controllers/             # HTTP layer (thin)
    │   ├── services/                # business logic (challan, stock, dashboard…)
    │   ├── routes/                  # REST route definitions + role guards
    │   ├── middleware/              # requireAuth, requireRole, error handling
    │   ├── validators/              # Zod schemas
    │   └── utils/                   # ApiError, ApiResponse, asyncHandler, token
    └── tests/                       # Vitest + Supertest integration tests
```

Backend follows **controllers → services → Prisma** separation. All business logic lives in `services/`; routes only wire middleware + validators + controllers. Critical operations (challan confirmation, stock adjustments, product creation with initial stock) run inside PostgreSQL transactions.

## 5. Database schema overview

Models: `User`, `Customer`, `CustomerFollowUp`, `Product`, `StockMovement`, `SalesChallan`, `SalesChallanItem`.

### Relationships

```
User
 ├── Customers created
 ├── Follow-ups created
 ├── Stock movements created
 └── Challans created

Customer
 ├── FollowUps          (cascade delete)
 └── SalesChallans

Product
 ├── StockMovements     (cascade delete)
 └── SalesChallanItems

SalesChallan
 ├── Customer
 ├── CreatedBy User
 └── Items              (cascade delete)

SalesChallanItem
 ├── SalesChallan
 └── Product            (snapshot columns preserve history)
```

### Key design decisions

- `Product.sku` is `@unique`.
- `SalesChallan.challanNumber` is `@unique` and generated server-side (`CH-<year>-<6 digits>`).
- `SalesChallanItem` stores `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot` and `lineTotal` so historical challans stay accurate even if the product changes later.
- Decimal prices use `@db.Decimal(12, 2)`.
- Indexes on all commonly filtered/joined fields (status, type, category, `productId + createdAt`, `customerId + createdAt`, `createdAt`, etc.).

## 6. Local setup

Prerequisites: **Node.js 20+**, **PostgreSQL 14+**.

```bash
# 1. Clone & install
git clone https://github.com/ashu8349/mini-ERP-CRM-operations-portal.git
cd mini-ERP-CRM-operations-portal

# 2. Server
cd backend
npm install
cp .env.example .env          # then edit DATABASE_URL, JWT_SECRET
npx prisma migrate dev        # create & migrate the database
npx prisma db seed            # demo users + sample data

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env.local    # VITE_API_URL=http://localhost:5000/api
```

## 7. Environment variables

### Server (`backend/.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/opsflow"
JWT_SECRET="a-long-random-secret-string"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### Client (`frontend/.env.local`)

```env
VITE_API_URL="http://localhost:5000/api"
```

> Never commit real `.env` files. The repository ships `.env.example` templates only.

## 8. Database migration commands

```bash
cd backend
npx prisma migrate dev        # create a new migration from schema changes
npx prisma migrate deploy     # apply existing migrations (production)
npx prisma generate           # regenerate the Prisma client
npx prisma studio             # browse the database in the browser
```

## 9. Seed commands

```bash
cd backend
npx prisma db seed
```

Seeds demo users (see [section 17](#17-demo-credentials)), 10 customers, 15 products, stock movements and sample challans (drafts + confirmed). **Demo passwords must be changed in production.**

## 10. Running frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## 11. Running backend

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev        # http://localhost:5000
```

Health check: `GET /api/health`.

## 12. API documentation

All endpoints return `{ success, message, data, errors?, pagination? }`.

### Auth
| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | returns `{ token, user }` |
| GET | `/api/auth/me` | auth | current user |

### Customers
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/customers` | auth — `page, limit, search, customerType, status` |
| GET | `/api/customers/:id` | auth — includes follow-ups + challans |
| POST | `/api/customers` | SALES, ADMIN |
| PUT | `/api/customers/:id` | SALES, ADMIN |
| DELETE | `/api/customers/:id` | ADMIN |
| GET | `/api/customers/:id/followups` | auth |
| POST | `/api/customers/:id/followups` | SALES, ADMIN |

### Products
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/products` | auth — `page, limit, search, category, lowStock` |
| GET | `/api/products/categories` | auth |
| GET | `/api/products/:id` | auth — includes recent stock movements |
| POST | `/api/products` | ADMIN (creates Initial Stock IN movement) |
| PUT | `/api/products/:id` | ADMIN |
| GET | `/api/products/:id/stock-movements` | auth |
| POST | `/api/products/:id/stock-movements` | ADMIN, WAREHOUSE |

### Stock movements
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/stock-movements` | auth — `page, limit, search, productId, movementType` |
| POST | `/api/stock-movements` | ADMIN, WAREHOUSE — `{ productId, quantity, movementType, reason }` |

### Challans
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/challans` | auth — `page, limit, search, status, customerId` |
| GET | `/api/challans/:id` | auth |
| POST | `/api/challans` | SALES, ADMIN — creates DRAFT with auto number |
| PUT | `/api/challans/:id` | SALES, ADMIN — DRAFT only |
| POST | `/api/challans/:id/confirm` | SALES, ADMIN — atomic stock deduction |
| POST | `/api/challans/:id/cancel` | SALES, ADMIN — cancelled before confirmation only |

### Dashboard & users
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/dashboard/stats` | auth |
| GET | `/api/users` | ADMIN |
| GET | `/api/users/:id` | ADMIN |

### Pagination response shape

```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}
```

### Error response shape

```json
{
  "success": false,
  "message": "Insufficient stock for product SKU-1001",
  "errors": []
}
```

Centralized error middleware handles 400 (validation/business), 401 (unauthenticated), 403 (forbidden role), 404 (not found), 409 (duplicate SKU / challan number collision) and 500. Stack traces are hidden in production.

## 13. Authentication

- Passwords hashed with **bcrypt** (10 rounds). Never stored or returned in plain text.
- Login returns a **JWT** signed with `JWT_SECRET` containing `userId`, `email` and `role`.
- Frontend stores the token in `localStorage`, sends `Authorization: Bearer <token>` on every request, restores the session via `GET /api/auth/me`, and logs out automatically on a 401.

## 14. Role permissions

| Capability | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| --- | :-: | :-: | :-: | :-: |
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View customers | ✅ | ✅ | ✅ | ✅ |
| Create/edit customers | ✅ | ✅ | ❌ | ❌ |
| Delete customers | ✅ | ❌ | ❌ | ❌ |
| Add follow-up notes | ✅ | ✅ | ❌ | ❌ |
| View products/stock | ✅ | ✅ | ✅ | ✅ |
| Create/edit products | ✅ | ❌ | ❌ | ❌ |
| Record stock movements | ✅ | ❌ | ✅ | ❌ |
| Create/edit/confirm challans | ✅ | ✅ | ❌ | ❌ |
| View challans | ✅ | ✅ | ✅ | ✅ |
| View users | ✅ | ❌ | ❌ | ❌ |

Authorization is enforced by `requireAuth` + `requireRole(...)` middleware on every protected route — frontend guards are convenience only.

## 15. Business rules

1. **Stock never negative** — OUT movements exceeding current stock are rejected with a 400.
2. **No silent stock changes** — every stock change creates a `StockMovement` record (`IN`/`OUT`, reason, actor, timestamp) inside the same transaction as the product update.
3. **Draft challans don't touch stock.** Confirming a challan:
   - validates stock for **every** item first, rejects the entire operation with a 400 if any item is short (no partial stock updates),
   - deducts stock and creates one `OUT` movement per item (`reason = "Sales Challan"`),
   - flips status to `CONFIRMED`,
   - all inside a single PostgreSQL transaction that rolls back atomically.
4. **Challan status transitions are restricted** — only DRAFT can be edited or confirmed; CONFIRMED challans cannot be edited or cancelled; CANCELLED challans cannot be confirmed.
5. **Challan numbers are auto-generated** (`CH-2026-000001`) and unique; users can never type them.
6. **Snapshots** of product name, SKU and price are stored on each challan item at creation.
7. **Low stock** = `currentStock <= minimumStock`.

## 16. Deployment instructions

### Database — Neon / Supabase
Create a free PostgreSQL instance and copy its connection string into `DATABASE_URL` (Neon strings use `?sslmode=require`). Run `npx prisma migrate deploy` and `npx prisma db seed` against it (e.g. from the server directory after `npm install`).

### Backend — Render / Railway
1. Create a new web service from this repo, root directory `backend/`.
2. Build command: `npm install && npm run prisma:generate && npm run build` (on first deploy, append `&& npm run db:deploy && npm run db:seed` once, so the production database gets its tables and seed data — the commands are idempotent, so keeping them is also safe).
3. Start command: `npm start`
4. Environment variables: `DATABASE_URL`, `JWT_SECRET` (long random string), `JWT_EXPIRES_IN`, `PORT`, `CLIENT_URL` (your frontend URL), `NODE_ENV=production`.
5. Do **not** set `NODE_ENV=production` as an install-time env var: it makes `npm install` skip devDependencies (`typescript`, `@types/node`, `prisma`), which breaks the build.

> **TypeScript version is pinned to `5.9.3` (exact).** Do not loosen this to `^5.9.3`:
> newer TypeScript majors (6.x/7.x) removed the old `node`/`node10` module resolution
> values and fail with `TS5108: Option 'moduleResolution=node10' has been removed`.

### Frontend — Vercel / Netlify
1. Root directory: `frontend/`.
2. Build command: `npm run build`, output directory: `dist/`.
3. Environment variable: `VITE_API_URL=https://<your-backend>.onrender.com` (the `/api` prefix is appended automatically by `frontend/src/utils/constants.js` — do **not** add it yourself).
4. Deploy — the built app calls the deployed API with CORS already configured for your `CLIENT_URL`.

### Current live deployment

| Part | URL | Notes |
| --- | --- | --- |
| Backend (Render) | `https://opsflow-erp-backend.onrender.com` | PostgreSQL on Render; migrations + seed applied |
| Frontend (Vercel) | Vercel project connected to `main` branch | `VITE_API_URL = https://opsflow-erp-backend.onrender.com` |
| Login endpoint | `POST https://opsflow-erp-backend.onrender.com/api/auth/login` | JSON body `{ email, password }` |

### Optional — AWS deployment (documented, no paid resources required)
- **AWS EC2**: run the backend with Node.js behind Nginx (reverse proxy + TLS via certbot).
- **AWS RDS (PostgreSQL)**: replace `DATABASE_URL`; run `npx prisma migrate deploy`.
- **AWS S3 + CloudFront**: upload `frontend/dist` as a static site, point CloudFront at the bucket, set `VITE_API_URL` to the EC2 API domain.
- Use SSM Parameter Store or Secrets Manager for `JWT_SECRET` instead of env files.

## 17. Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin@123` |
| Sales | `sales@example.com` | `Sales@123` |
| Warehouse | `warehouse@example.com` | `Warehouse@123` |
| Accounts | `accounts@example.com` | `Accounts@123` |

> ⚠️ These are demo credentials created by the seed script for local evaluation only.
> Never use these credentials in a production environment.

## 18. Screenshots

| | |
| --- | --- |
| Login screen (with demo account quick-fill) | Dashboard (stat cards, charts, recent activity) |
| Customer list (search/filter/pagination) | Customer detail (follow-ups + challans) |
| Product list (low-stock badges) | Challan editor (line items + live totals) |
| Challan detail (snapshots + totals) | Stock movements (IN/OUT history) |

Run the app locally and follow [section 6](#6-local-setup) to see the UI live.

## 19. Future improvements

- Password reset flow and email verification.
- Printable challan / invoice (PDF export).
- Sales targets and per-role reporting views.
- Real-time stock synchronization (WebSockets).
- Audit log with before/after values.
- Multi-warehouse support.
- Rate limiting and refresh-token rotation for extra API hardiness.

## 20. Changelog

Deployment hardening and fixes applied while moving from local development to live deployments (Vercel + Render):

| Date | Change | Why |
| --- | --- | --- |
| Aug 2026 | `backend/tsconfig.json` → `module`/`moduleResolution: node16`, removed `types: ["node"]`; pinned `typescript` to exact `5.9.3` | Render's newer TypeScript (6.x/7.x) removed the old `node`/`node10` resolution (`TS5108`) and failed to resolve the explicit `node` types (`TS2688`) |
| Aug 2026 | `API_BASE_URL` always appends `/api` to `VITE_API_URL` | Deployed frontend called `…/auth/login` instead of `…/api/auth/login` → "Route not found" |
| Aug 2026 | Profile/notification dropdowns — `z-50` on the topbar | Dropdown was hidden behind page content because the topbar's `backdrop-blur` created an isolated stacking context |
| Aug 2026 | Mobile sidebar closes on navigation | Sidebar stayed open after tapping a nav item on small screens |
| Aug 2026 | Axios request interceptor drops empty/`null` query params; customer query schema accepts empty `customerType`/`status` strings | `?customerType=&status=` (empty filters) failed backend enum validation on Customers, Challans, Products and Inventory lists |
| Aug 2026 | Challan form loads customers/products with `limit: 100` (was 200) | Backend caps list `limit` at 100 → validation error when opening the new-challan form |
| Aug 2026 | API error toasts show detailed field errors; empty `errors: []` falls back to the server message | Generic "Validation failed" gave no clue; empty errors array produced a blank toast (e.g. invalid login) |
| Aug 2026 | Dashboard redesigned with a soft, professional pastel theme | Replaced the generic blue/violet look — light tinted stat cards with accent bars, calm hero banner, muted chart colors |

---

Built as a full-stack assignment demonstrating production-quality development practices. See `prompt.txt` at the repository root for the original specification.