-- SafeSend database schema
-- Run with: psql -U <user> -d safesend -f database/schema.sql

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  profession TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- completed | reversed
  concern_level TEXT, -- LOW | MODERATE | HIGH
  concern_reasons JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_recipient_id ON transactions(recipient_id);
CREATE INDEX idx_recipients_user_id ON recipients(user_id);

-- ─────────────────────────────────────────────
-- Demo seed data
-- ─────────────────────────────────────────────

INSERT INTO users (name, email, balance) VALUES
  ('Rahul', 'rahul@demo.safesend', 50000),
  ('Priya', 'priya@demo.safesend', 32000),
  ('Arun', 'arun@demo.safesend', 18500);

-- Rahul's recipients (user_id = 1)
INSERT INTO recipients (user_id, name, upi_id, profession) VALUES
  (1, 'Rahul Kumar', 'rahulkumar@upi', 'Electrician'),
  (1, 'Priya Sharma', 'priyasharma@upi', 'Designer'),
  (1, 'Rohit Kumar', 'rohitkumar@upi', 'Contractor'),
  (1, 'City Power Board', 'citypower@upi', NULL);

-- Priya's recipients (user_id = 2)
INSERT INTO recipients (user_id, name, upi_id, profession) VALUES
  (2, 'Arjun Mehta', 'arjunmehta@upi', 'Landlord'),
  (2, 'Rahul', 'rahul.p@upi', NULL);

-- Arun's recipients (user_id = 3)
INSERT INTO recipients (user_id, name, upi_id, profession) VALUES
  (3, 'Sana Traders', 'sanatraders@upi', 'Wholesaler');

-- Rahul's transaction history: recurring small payments to Rahul Kumar (electrician)
-- These establish the "usual range" of ₹2,000 - ₹3,000
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
  (1, 1, 2000, 'completed', 'LOW', '[]', now() - interval '90 days'),
  (1, 1, 2500, 'completed', 'LOW', '[]', now() - interval '60 days'),
  (1, 1, 3000, 'completed', 'LOW', '[]', now() - interval '30 days'),
  (1, 1, 2800, 'completed', 'LOW', '[]', now() - interval '10 days');

-- Recurring ~30-day bill, for the timing pattern demo. Three past payments
-- establish a clear 30-day cadence; the most recent was only 15 days ago,
-- so paying it again today reads as earlier than usual.
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
  (1, 4, 1800, 'completed', 'LOW', '[]', now() - interval '75 days'),
  (1, 4, 1800, 'completed', 'LOW', '[]', now() - interval '45 days'),
  (1, 4, 1800, 'completed', 'LOW', '[]', now() - interval '15 days');

-- Prior payments to Priya Sharma - establishes familiarity for the "normal" demo scenario
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
  (1, 2, 4000, 'completed', 'LOW', '[]', now() - interval '45 days'),
  (1, 2, 3800, 'completed', 'LOW', '[]', now() - interval '15 days');
