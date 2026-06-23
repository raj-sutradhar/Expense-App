-- Create core tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default bank required by the mobile app UI
INSERT INTO banks (id, name) VALUES (1, 'Cash / Default Bank');

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    bank_id INTEGER REFERENCES banks(id),
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    current_balance NUMERIC(12,2) DEFAULT 0,
    account_type VARCHAR(20) DEFAULT 'BANK',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    monthly_fee NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    category VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE incomes (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    source VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    income_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'CREDIT' or 'DEBIT'
    amount NUMERIC(12,2) NOT NULL,
    balance_before NUMERIC(12,2),
    balance_after NUMERIC(12,2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    account_id INTEGER REFERENCES accounts(id),
    fee_amount NUMERIC(12,2),
    paid_amount NUMERIC(12,2),
    due_amount NUMERIC(12,2),
    billing_start DATE,
    billing_end DATE,
    remarks TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account_transfers (
    id SERIAL PRIMARY KEY,
    from_account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    amount NUMERIC(12,2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);