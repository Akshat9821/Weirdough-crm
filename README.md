# HelloWeirdough CRM

Order and operations CRM for [helloweirdough.in](https://helloweirdough.in) — bakery in Faridabad, India.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, Socket.io, Recharts, Tabler Icons
- **Backend:** Node.js, Express, Prisma, PostgreSQL, JWT auth, Twilio (WhatsApp + SMS)

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

1. **Clone and install**

```bash
cd "weirdough crm "
npm install
cd server && npm install && cd ../client && npm install && cd ..
```

2. **Environment**

```bash
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
cp .env server/.env
```

**macOS with Homebrew PostgreSQL** (most common — no Docker):

```bash
brew services start postgresql@14   # or @16
createdb helloweirdough_crm
```

In `server/.env`, use your Mac username (not `postgres:postgres`):

```
DATABASE_URL="postgresql://akshatsharma@localhost:5432/helloweirdough_crm?schema=public"
```

**Or Docker** (if Docker Desktop is running):

```bash
docker compose up -d
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/helloweirdough_crm?schema=public"
```

3. **Migrate and seed**

```bash
cd server
npx prisma migrate deploy
npm run db:seed
cd ..
```

4. **Run**

```bash
# From repo root
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:4000  

## Default login

| Role  | Email                      | Password    |
|-------|----------------------------|-------------|
| Owner | ravi@helloweirdough.in     | password123 |

Staff accounts use the same password (seed).

## Twilio (optional)

Without Twilio credentials, order notifications are **logged to the server console**. For WhatsApp sandbox testing, set `TWILIO_*` vars in `server/.env` and use verified recipient numbers.

## Design reference

See [`docs/design-preview.html`](docs/design-preview.html) for UI mockups.

## Project structure

```
client/          React frontend
server/          Express API + Prisma
server/prisma/   Schema and seed
server/routes/   REST modules
server/services/ notificationService.ts (Twilio)
```
