# SafeSend

**Think before you send.**

A digital payment safety checkpoint. Before a payment goes through, SafeSend
compares it against the sender's own past behaviour and surfaces a short,
plain-language context check — not a fraud verdict.

## Problem

Most payment apps ask a person to confirm a transfer with almost no context.
A slip of the thumb, a scam recipient with a name close to a saved contact,
or a payment that's unusually large or oddly timed all look identical to a
routine payment — until the money is already gone.

## Solution

SafeSend adds one short checkpoint before the money moves. It compares the
payment being made right now against the sender's own history — who they
usually pay, how much, and roughly when — and explains anything that stands
out, in plain language. The sender decides what to do with that context;
SafeSend never blocks a payment or claims to detect fraud.

## Features

- **Demo login** — pick one of three sample accounts, no passwords.
- **Dashboard** — balance, a Send Money shortcut, and recent activity.
- **Recipients** — saved payees with an optional profession field.
- **Send Money** — pick a recipient and amount, with balance/amount validation.
- **SafeSend Check** — checks familiarity, amount pattern, timing pattern, and
  similar-recipient names, then explains the result as LOW / MODERATE / HIGH
  concern with plain-language reasons (never a numeric "fraud score").
- **Payment Review** — final summary before authentication.
- **Simulated UPI PIN** — a demo-only 6-digit PIN pad.
- **10-second undo** — a real countdown to reverse a payment right after it
  completes, with balance and history updated live.
- **Transaction history** — grouped by day, with status and concern level.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL

## Architecture

```text
safesend/
├── client/            React + Vite frontend
│   └── src/
│       ├── components/  Reusable UI (Navbar, SafetyCheck, PinModal, UndoTimer, ...)
│       ├── pages/       Route-level screens (Login, Home, SendMoney, ...)
│       ├── context/     SessionContext — current demo user + balance
│       ├── data/        Static UI copy (demo taglines, demo PIN)
│       ├── utils/       Formatting + display-style helpers
│       └── api.ts       Thin fetch client for the backend
│
├── server/            Express + TypeScript backend
│   ├── routes/          recipients, payments, transactions, users
│   ├── services/
│   │   └── safetyEngine.ts   The SafeSend Check — all scoring logic lives here
│   └── database.ts      PostgreSQL connection pool
│
└── database/
    └── schema.sql      Tables + demo seed data
```

The frontend never computes safety logic itself — every SafeSend Check is
run server-side in `safetyEngine.ts` and returned as plain-language reasons.

## Setup

### Prerequisites

- Node.js 18+
- A local PostgreSQL server

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Create the database and load the schema

```bash
createdb safesend
psql -U postgres -d safesend -f database/schema.sql
```

This also seeds three demo users, their recipients, and enough transaction
history for every SafeSend Check scenario to work out of the box.

### 3. Configure environment variables

```bash
cp .env.example server/.env
```

Edit `server/.env` if your local Postgres uses different credentials.

### 4. Run the app

In two terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Open http://localhost:5173 — the Vite dev server proxies `/api` requests to
the backend automatically.

## Demo users

| Name  | Starting balance |
|-------|-------------------|
| Rahul | ₹50,000 |
| Priya | ₹32,000 |
| Arun  | ₹18,500 |

No passwords — just tap a name on the login screen.

## Demo UPI PIN

**`123456`** for every account. This is a simulated PIN only; SafeSend never
collects a real banking PIN, password, OTP, or card number.

## Try the SafeSend Check scenarios (as Rahul)

- **Normal payment:** pay **Priya Sharma** ₹4,000 → LOW concern.
- **Unusual amount:** pay **Rahul Kumar** ₹18,000 (his usual range is
  ₹2,000–₹3,000) → MODERATE/HIGH concern.
- **Similar recipient:** paying **Rahul Kumar** also surfaces a warning
  because a saved recipient named **Rohit Kumar** is a close name match.
- **Timing difference:** pay **City Power Board** → flagged as earlier than
  usual, since it's normally paid on a ~30-day cycle and the last payment was
  only 15 days ago.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/users` | List demo users (for login) |
| GET  | `/api/users/:id` | Get one user |
| GET  | `/api/recipients?userId=` | List a user's saved recipients |
| POST | `/api/recipients` | Add a recipient (`userId, name, upiId, profession?`) |
| POST | `/api/payments/check` | Run the SafeSend Check (`userId, recipientId, amount`) |
| POST | `/api/payments/confirm` | Confirm a payment with the demo PIN |
| POST | `/api/payments/undo` | Reverse a payment within the undo window |
| GET  | `/api/transactions?userId=` | List a user's transaction history |

## Future improvements

- Real authentication and per-device session handling
- Configurable/adaptive thresholds instead of fixed scoring weights
- Push/SMS-style confirmation for the undo window
- Support for recurring/scheduled payments
- Exportable transaction statements
\n\n## SafeHold update\n\nThe payment flow now uses **SafeHold** instead of a post-payment Undo. After PIN confirmation, the demo reserves the amount for 10 seconds. During that window the user can cancel; if the timer expires, the demo finalizes the transfer. This is a prototype simulation of a pre-transfer authorization/cancellation window, not a claim that a completed real UPI transaction can be recalled.\n\nThe Send Money screen also supports **Send to someone new**. A user can enter a name and UPI ID for a one-time payment without adding the person to their saved recipient list.\n\nIf using PostgreSQL, rerun `database/schema.sql` after this update so the `is_saved` and `hold_expires_at` columns are created. The offline demo mode does not require PostgreSQL.\n