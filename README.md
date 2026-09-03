# SafeSend Backend

SafeSend is a small hackathon MVP backend that adds a payment-safety checkpoint before a prototype digital payment is confirmed.

## Requirements
- Node.js 18+
- PostgreSQL 14+
- npm

## PostgreSQL setup

Create the database:

```bash
createdb safesend
```

Apply the schema and demo data:

```bash
psql -d safesend -f database/schema.sql
```

If `createdb` is unavailable, create a database named `safesend` using your PostgreSQL client, then run the `psql` command.

## Environment

Copy `.env.example` to `.env` inside `server/`:

```bash
cd server
```

Windows:

```powershell
copy ..\.env.example .env
```

macOS/Linux:

```bash
cp ../.env.example .env
```

Set `DATABASE_URL` to your local PostgreSQL connection string.

## Install and run

From the `server` directory:

```bash
npm install
npm run build
npm run dev
```

Production start after building:

```bash
npm start
```

## API

Base URL: `http://localhost:5000`

Health:
- `GET /health`

Recipients:
- `GET /api/recipients?userId=1`
- `POST /api/recipients`

Payments:
- `POST /api/payments/check`
- `POST /api/payments/confirm`
- `POST /api/payments/undo`

Transactions:
- `GET /api/transactions?userId=1`

### Check example

```json
{
  "userId": 1,
  "recipientId": 1,
  "amount": 18000
}
```

The check endpoint only evaluates payment context. It does not deduct balance or create a completed transaction.

### Confirm example

```json
{
  "userId": 1,
  "recipientId": 1,
  "amount": 18000,
  "concernLevel": "HIGH",
  "concernReasons": "Amount is much higher or lower than previous payments; A similar saved recipient exists"
}
```

Confirmation deducts balance and creates the transaction atomically in a PostgreSQL transaction.

### Undo example

```json
{
  "transactionId": 1
}
```

Undo reverses a completed prototype transaction and restores its amount atomically. The frontend is responsible for the 10-second countdown. This is a prototype simulation, not a claim that all real-world UPI payments can be universally reversed within 10 seconds.

## Safety Engine

SafeSend checks:
- familiar recipient
- unusual amount compared with previous payments
- simple timing-pattern difference
- similar saved recipient name

Concern score:
- new recipient: +25
- similar recipient: +30
- unusual amount: +30
- unusual timing: +10

Levels:
- 0–20: LOW
- 21–50: MODERATE
- 51+: HIGH

The engine identifies unusual payment characteristics; it does not prove fraud.

## Demo

Rahul has previous payments to Rahul Kumar of ₹2,000, ₹2,500 and ₹3,000. A check for ₹18,000 can therefore demonstrate the unusual-amount warning. Rahul K. is also present as a similar saved recipient.

## Error handling

Validation errors, missing users/recipients/transactions, insufficient balance, repeated undo, database failures and unknown routes return JSON errors without exposing server stack traces.

Live database testing requires a local PostgreSQL instance and credentials configured in `.env`.
