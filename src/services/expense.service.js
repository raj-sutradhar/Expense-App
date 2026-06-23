const pool = require("../config/db");

const createExpense = async (userId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { account_id, category, amount, description, expense_date } = data;
    const finalDate = expense_date ? new Date(expense_date) : new Date();

    // Check account
    const accountResult = await client.query(
      `
      SELECT *
      FROM accounts
      WHERE id = $1 AND user_id = $2
      `,
      [account_id, userId],
    );

    if (accountResult.rows.length === 0) {
      throw new Error("Account not found");
    }

    const account = accountResult.rows[0];

    const oldBalance = Number(account.current_balance);

    if (oldBalance < Number(amount)) {
      throw new Error("Insufficient account balance");
    }

    const newBalance = oldBalance - Number(amount);

    // Update account balance
    await client.query(
      `
      UPDATE accounts
      SET current_balance = $1
      WHERE id = $2 AND user_id = $3
      `,
      [newBalance, account_id, userId],
    );

    // Insert expense
    const expenseResult = await client.query(
      `
      INSERT INTO expenses
      (
        account_id,
        category,
        amount,
        description,
        expense_date,
        user_id
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6
      )
      RETURNING *
      `,
      [account_id, category, amount, description, finalDate, userId],
    );

    const expense = expenseResult.rows[0];

    // Insert transaction
    await client.query(
      `
      INSERT INTO transactions
      (
        account_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        reference_type,
        reference_id,
        notes,
        created_at,
        user_id
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      `,
      [
        account_id,
        "DEBIT",
        amount,
        oldBalance,
        newBalance,
        "EXPENSE",
        expense.id,
        description,
        finalDate,
        userId,
      ],
    );

    await client.query("COMMIT");

    return expense;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const getExpenses = async (userId) => {
  const result = await pool.query(`
    SELECT
      e.*,
      a.account_name
    FROM expenses e
    LEFT JOIN accounts a
      ON e.account_id = a.id
    WHERE e.user_id = $1
    ORDER BY e.id DESC
  `, [userId]);

  return result.rows;
};
const getExpenseById = async (userId, id) => {
  const result = await pool.query(
    `
    SELECT
      e.*,
      a.account_name
    FROM expenses e
    LEFT JOIN accounts a
      ON e.account_id = a.id
    WHERE e.id = $1 AND e.user_id = $2
    `,
    [id, userId],
  );

  return result.rows[0];
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
};