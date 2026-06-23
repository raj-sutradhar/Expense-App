const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigration() {
  try {
    console.log("Connecting to PG database for migration...");
    
    // Ensure there is at least one user in the database to assign existing orphaned rows to.
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

    const tablesToMigrate = [
      "clients",
      "accounts",
      "expenses",
      "transactions",
      "payments",
      "payment_history",
      "account_transfers"
    ];

    for (const tableName of tablesToMigrate) {
      // Check if user_id column exists
      const colCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = 'user_id'
      `, [tableName]);

      if (colCheck.rows.length === 0) {
        console.log(`Adding 'user_id' column to table '${tableName}'...`);
        // Add column
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN user_id INTEGER REFERENCES users(id)`);
        // Update existing records to default user
        const updateRes = await pool.query(`UPDATE ${tableName} SET user_id = $1 WHERE user_id IS NULL`, [defaultUserId]);
        console.log(`Updated ${updateRes.rowCount} existing records in '${tableName}' to user_id ${defaultUserId}`);
      } else {
        console.log(`Table '${tableName}' already has 'user_id' column.`);
        // Just in case, update any null user_ids to default user
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
