DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  upi_id VARCHAR(150) NOT NULL,
  profession VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient_id INTEGER NOT NULL REFERENCES recipients(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED','REVERSED')),
  concern_level VARCHAR(20) CHECK (concern_level IS NULL OR concern_level IN ('LOW','MODERATE','HIGH')),
  concern_reasons TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipients_user_id ON recipients(user_id);
CREATE INDEX idx_transactions_user_id_created_at ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_recipient_id_created_at ON transactions(recipient_id, created_at DESC);

INSERT INTO users (name, email, balance) VALUES
('Rahul', 'rahul@example.com', 50000),
('Priya', 'priya@example.com', 35000),
('Arun', 'arun@example.com', 40000);

INSERT INTO recipients (user_id, name, upi_id, profession) VALUES
(1, 'Rahul Kumar', 'rahul@upi', 'Electrician'),
(1, 'Priya Sharma', 'priya@upi', 'Designer'),
(1, 'Rohit Kumar', 'rohit@upi', 'Contractor'),
(1, 'Rahul K.', 'rahulk@upi', NULL);

INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons, created_at) VALUES
(1, 1, 2000, 'COMPLETED', 'LOW', 'Recipient is familiar', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(1, 1, 2500, 'COMPLETED', 'LOW', 'Recipient is familiar', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(1, 1, 3000, 'COMPLETED', 'LOW', 'Recipient is familiar', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 2, 1500, 'COMPLETED', 'LOW', 'Recipient is familiar', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(1, 2, 1600, 'COMPLETED', 'LOW', 'Recipient is familiar', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(1, 3, 4000, 'COMPLETED', 'LOW', 'Recipient is familiar', CURRENT_TIMESTAMP - INTERVAL '15 days');
