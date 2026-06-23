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


const schema = {
  users: {
    name: "VARCHAR(100) NOT NULL",
    email: "VARCHAR(150) UNIQUE NOT NULL",
    password: "TEXT NOT NULL",
    created_at: "TIMESTAMP DEFAULT NOW()"
  },
  banks: {
    name: "VARCHAR(100) NOT NULL",
    created_at: "TIMESTAMP DEFAULT NOW()"
  },
  accounts: {
    bank_id: "INTEGER REFERENCES banks(id)",
    account_name: "VARCHAR(100) NOT NULL",
    account_number: "VARCHAR(50)",
    current_balance: "NUMERIC(12,2) DEFAULT 0",
    account_type: "VARCHAR(20) DEFAULT 'BANK'",
    created_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  },
  clients: {
    full_name: "VARCHAR(100) NOT NULL",
    phone: "VARCHAR(20)",
    monthly_fee: "NUMERIC(12,2) DEFAULT 0",
    status: "VARCHAR(20) DEFAULT 'ACTIVE'",
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  },
  expenses: {
    account_id: "INTEGER REFERENCES accounts(id)",
    category: "VARCHAR(100)",
    amount: "NUMERIC(12,2) NOT NULL",
    description: "TEXT",
    expense_date: "DATE DEFAULT CURRENT_DATE",
    created_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  },
  incomes: {
    account_id: "INTEGER REFERENCES accounts(id)",
    source: "VARCHAR(150) NOT NULL",
    amount: "NUMERIC(12,2) NOT NULL",
    description: "TEXT",
    income_date: "DATE DEFAULT CURRENT_DATE",
    created_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  },
  transactions: {
    account_id: "INTEGER REFERENCES accounts(id)",
    transaction_type: "VARCHAR(20) NOT NULL",
    amount: "NUMERIC(12,2) NOT NULL",
    balance_before: "NUMERIC(12,2)",
    balance_after: "NUMERIC(12,2)",
    reference_type: "VARCHAR(50)",
    reference_id: "INTEGER",
    notes: "TEXT",
    created_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  },
  payment_history: {
    client_id: "INTEGER REFERENCES clients(id)",
    account_id: "INTEGER REFERENCES accounts(id)",
    fee_amount: "NUMERIC(12,2)",
    paid_amount: "NUMERIC(12,2)",
    due_amount: "NUMERIC(12,2)",
    billing_start: "DATE",
    billing_end: "DATE",
    remarks: "TEXT",
    payment_date: "DATE DEFAULT CURRENT_DATE",
    created_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  },
  account_transfers: {
    from_account_id: "INTEGER REFERENCES accounts(id)",
    to_account_id: "INTEGER REFERENCES accounts(id)",
    amount: "NUMERIC(12,2) NOT NULL",
    remarks: "TEXT",
    created_at: "TIMESTAMP DEFAULT NOW()",
    user_id: "INTEGER REFERENCES users(id)"
  }
};

async function runMigration() {
  try {
    console.log("Connecting to PG database for migration...");

    // 1. Re-create or create tables and fields
    for (const [tableName, columns] of Object.entries(schema)) {
      console.log(`Ensuring table '${tableName}' exists...`);
      await pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL PRIMARY KEY)`);

      for (const [colName, colDef] of Object.entries(columns)) {
        // Special case: if clients table has column 'name', rename or drop it
        if (tableName === "clients" && colName === "full_name") {
          const hasName = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'clients' 
                AND column_name = 'name'
            )
          `);
          const hasFullName = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'clients' 
                AND column_name = 'full_name'
            )
          `);

          if (hasName.rows[0].exists && !hasFullName.rows[0].exists) {
            console.log("Renaming column 'name' to 'full_name' in table 'clients'...");
            await pool.query("ALTER TABLE clients RENAME COLUMN name TO full_name");
            continue;
          } else if (hasName.rows[0].exists && hasFullName.rows[0].exists) {
            console.log("Both 'name' and 'full_name' exist in 'clients'. Copying data and dropping 'name'...");
            await pool.query("UPDATE clients SET full_name = name WHERE full_name IS NULL OR full_name = ''");
            await pool.query("ALTER TABLE clients DROP COLUMN name");
          }
        }

        // Special case: if accounts table has column 'name', rename or drop it
        if (tableName === "accounts" && colName === "account_name") {
          const hasName = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'accounts' 
                AND column_name = 'name'
            )
          `);
          const hasAccountName = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'accounts' 
                AND column_name = 'account_name'
            )
          `);

          if (hasName.rows[0].exists && !hasAccountName.rows[0].exists) {
            console.log("Renaming column 'name' to 'account_name' in table 'accounts'...");
            await pool.query("ALTER TABLE accounts RENAME COLUMN name TO account_name");
            continue;
          } else if (hasName.rows[0].exists && hasAccountName.rows[0].exists) {
            console.log("Both 'name' and 'account_name' exist in 'accounts'. Copying data and dropping 'name'...");
            await pool.query("UPDATE accounts SET account_name = name WHERE account_name IS NULL OR account_name = ''");
            await pool.query("ALTER TABLE accounts DROP COLUMN name");
          }
        }

        // Special case: if transactions table has column 'type', rename or drop it
        if (tableName === "transactions" && colName === "transaction_type") {
          const hasType = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'transactions' 
                AND column_name = 'type'
            )
          `);
          const hasTransactionType = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'transactions' 
                AND column_name = 'transaction_type'
            )
          `);

          if (hasType.rows[0].exists && !hasTransactionType.rows[0].exists) {
            console.log("Renaming column 'type' to 'transaction_type' in table 'transactions'...");
            await pool.query("ALTER TABLE transactions RENAME COLUMN type TO transaction_type");
            continue;
          } else if (hasType.rows[0].exists && hasTransactionType.rows[0].exists) {
            console.log("Both 'type' and 'transaction_type' exist in 'transactions'. Copying data and dropping 'type'...");
            await pool.query("UPDATE transactions SET transaction_type = type WHERE transaction_type IS NULL OR transaction_type = ''");
            await pool.query("ALTER TABLE transactions DROP COLUMN type");
          }
        }

        // Standard column check
        const colCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = $1 
              AND column_name = $2
          )
        `, [tableName, colName]);

        if (!colCheck.rows[0].exists) {
          console.log(`Adding missing column '${colName}' to table '${tableName}'...`);
          await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colDef}`);
        }
      }
    }

    console.log("Core tables and columns check complete.");

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

    // 4. Backfill user_id in user-scoped tables if null
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
      const updateRes = await pool.query(`UPDATE ${tableName} SET user_id = $1 WHERE user_id IS NULL`, [defaultUserId]);
      if (updateRes.rowCount > 0) {
        console.log(`Updated ${updateRes.rowCount} orphaned records in '${tableName}' to user_id ${defaultUserId}`);
      }
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
