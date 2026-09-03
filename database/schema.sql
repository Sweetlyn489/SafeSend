-- =========================================================
-- SafeSend MVP - PostgreSQL Schema
-- Safe to run on a fresh database.
-- =========================================================

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS recipients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================================
-- Table: users
-- =========================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Table: recipients
-- =========================================================
CREATE TABLE recipients (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    upi_id      VARCHAR(150) NOT NULL,
    profession  VARCHAR(100),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Table: transactions
-- =========================================================
CREATE TABLE transactions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    INTEGER NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
                        CHECK (status IN ('COMPLETED', 'REVERSED')),
    concern_level   VARCHAR(20)
                        CHECK (concern_level IS NULL OR concern_level IN ('LOW', 'MODERATE', 'HIGH')),
    concern_reasons TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX idx_recipients_user_id      ON recipients(user_id);
CREATE INDEX idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX idx_transactions_recipient_id ON transactions(recipient_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- =========================================================
-- Demo Data: Users
-- =========================================================
INSERT INTO users (name, email, balance) VALUES
('Rahul', 'rahul@example.com', 50000),
('Priya', 'priya@example.com', 35000),
('Arun',  'arun@example.com', 40000);

-- =========================================================
-- Demo Data: Recipients (for Rahul, user_id = 1)
-- =========================================================
INSERT INTO recipients (user_id, name, upi_id, profession) VALUES
(1, 'Rahul Kumar', 'rahul@upi',  'Electrician'),   -- id 1: familiar recipient
(1, 'Priya Sharma', 'priya@upi', 'Designer'),       -- id 2
(1, 'Rohit Kumar', 'rohit@upi',  'Contractor'),     -- id 3: similar name to "Rahul Kumar"
(1, 'Rahul K.',    'rahulk@upi', NULL);              -- id 4: similar name, no profession

-- A recipient for Priya (user_id = 2), for isolation/testing
INSERT INTO recipients (user_id, name, upi_id, profession) VALUES
(2, 'Arun Traders', 'aruntraders@upi', 'Retailer');

-- =========================================================
-- Demo Data: Transactions
-- =========================================================

-- Recurring "normal" payments from Rahul to Rahul Kumar (recipient_id = 1)
-- Establishes a familiar recipient + a consistent amount + a monthly timing pattern.
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(1, 1, 2000.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '90 days'),
(1, 1, 2500.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '60 days'),
(1, 1, 2200.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '30 days'),
(1, 1, 3000.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '5 days');

-- Unusual amount: much larger payment to the same familiar recipient, sent today
-- (breaks both the "usual amount" pattern and the "usual timing" pattern)
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(1, 1, 18000.00, 'COMPLETED', 'HIGH', 'Amount significantly higher than previous payments to this recipient; unusual timing compared to recurring pattern', CURRENT_DATE);

-- A smaller, older payment to the similarly-named recipient "Rohit Kumar" (recipient_id = 3)
-- Enables the similar-recipient check when a new payment is made to "Rahul Kumar" / "Rahul K."
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(1, 3, 1500.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '45 days');

-- A one-off payment to Priya Sharma (recipient_id = 2), no concerns
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(1, 2, 5000.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '20 days');

-- A reversed transaction, to demonstrate undo/restore-balance support
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(1, 4, 1000.00, 'REVERSED', 'MODERATE', 'Payment to a rarely used, similarly named recipient', CURRENT_DATE - INTERVAL '10 days');

-- Demo data for Priya (user_id = 2) paying Arun Traders (recipient_id = 5)
INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(2, 5, 4000.00, 'COMPLETED', 'LOW', NULL, CURRENT_DATE - INTERVAL '15 days');
