CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    age INTEGER,
    gender VARCHAR(20),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    account_id INTEGER REFERENCES accounts(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
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
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),

    type VARCHAR(20) NOT NULL,

    reference_type VARCHAR(50),

    reference_id INTEGER,

    amount NUMERIC(12,2) NOT NULL,

    balance_before NUMERIC(12,2),

    balance_after NUMERIC(12,2),

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