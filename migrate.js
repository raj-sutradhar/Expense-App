const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1"
    ? { rejectUnauthorized: false }
    : false,
});

async function runMigration() {
  try {
    console.log("Connecting to PG database for migration...");

    // 1. Create tables if they do not exist
    console.log("Ensuring core tables exist...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        account_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(50),
        current_balance NUMERIC(12,2) DEFAULT 0,
        account_type VARCHAR(20) DEFAULT 'BANK',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        monthly_fee NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id),
        category VARCHAR(100),
        amount NUMERIC(12,2) NOT NULL,
        description TEXT,
        expense_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incomes (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id),
        source VARCHAR(150) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        description TEXT,
        income_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id),
        transaction_type VARCHAR(20) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        balance_before NUMERIC(12,2),
        balance_after NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
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
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_transfers (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER REFERENCES accounts(id),
        to_account_id INTEGER REFERENCES accounts(id),
        amount NUMERIC(12,2) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Core tables check complete.");

    // 2. Seed default bank
    await pool.query(`
      INSERT INTO banks (id, name)
      SELECT 1, 'Cash / Default Bank'
      WHERE NOT EXISTS (SELECT 1 FROM banks WHERE id = 1)
    `);
    console.log("Default bank seeded (if missing).");

    // 3. Ensure a default user exists and get its ID
    const userCheck = await pool.query("SELECT id FROM users LIMIT 1");
    let defaultUserId = null;
    
    if (userCheck.rows.length === 0) {
      console.log("No users found. Creating a default user 'admin@gym.com'...");
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const insertUserRes = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
        ["Admin", "admin@gym.com", hashedPassword]
      );
      defaultUserId = insertUserRes.rows[0].id;
      console.log(`Created default user with ID: ${defaultUserId}`);
    } else {
      defaultUserId = userCheck.rows[0].id;
      console.log(`Using existing user with ID: ${defaultUserId} for migrations`);
    }

    // Helper function to check if column exists
    async function checkAndAddColumn(tableName, columnName, alterQuery) {
      const colCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
      `, [tableName, columnName]);

      if (colCheck.rows.length === 0) {
        console.log(`Adding missing column '${columnName}' to table '${tableName}'...`);
        await pool.query(alterQuery);
      }
    }

    // 4. Ensure specific columns exist
    // accounts columns
    await checkAndAddColumn("accounts", "bank_id", "ALTER TABLE accounts ADD COLUMN bank_id INTEGER REFERENCES banks(id)");
    await checkAndAddColumn("accounts", "account_number", "ALTER TABLE accounts ADD COLUMN account_number VARCHAR(50)");
    await checkAndAddColumn("accounts", "account_type", "ALTER TABLE accounts ADD COLUMN account_type VARCHAR(20) DEFAULT 'BANK'");

    // transactions columns
    await checkAndAddColumn("transactions", "reference_type", "ALTER TABLE transactions ADD COLUMN reference_type VARCHAR(50)");
    await checkAndAddColumn("transactions", "reference_id", "ALTER TABLE transactions ADD COLUMN reference_id INTEGER");
    await checkAndAddColumn("transactions", "notes", "ALTER TABLE transactions ADD COLUMN notes TEXT");

    // 5. Ensure user_id column exists in all user-scoped tables
    const userScopedTables = [
      "clients",
      "accounts",
      "expenses",
      "incomes",
      "transactions",
      "payment_history",
      "account_transfers"
    ];

    for (const tableName of userScopedTables) {
      const colCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = 'user_id'
      `, [tableName]);

      if (colCheck.rows.length === 0) {
        console.log(`Adding 'user_id' column to table '${tableName}'...`);
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN user_id INTEGER REFERENCES users(id)`);
        const updateRes = await pool.query(`UPDATE ${tableName} SET user_id = $1 WHERE user_id IS NULL`, [defaultUserId]);
        console.log(`Updated ${updateRes.rowCount} existing records in '${tableName}' to user_id ${defaultUserId}`);
      } else {
        const updateRes = await pool.query(`UPDATE ${tableName} SET user_id = $1 WHERE user_id IS NULL`, [defaultUserId]);
        if (updateRes.rowCount > 0) {
          console.log(`Updated ${updateRes.rowCount} orphaned records in '${tableName}' to user_id ${defaultUserId}`);
        }
      }
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
