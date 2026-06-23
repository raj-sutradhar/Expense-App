const pool = require("../config/db");

const createIncome = async (userId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { account_id, source, amount, description, income_date } = data;
    const finalDate = income_date ? new Date(income_date) : new Date();

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
    const newBalance = oldBalance + Number(amount);

    // Update account balance
    await client.query(
      `
      UPDATE accounts
      SET current_balance = $1
      WHERE id = $2 AND user_id = $3
      `,
      [newBalance, account_id, userId],
    );

    // Insert custom income
    const incomeResult = await client.query(
      `
      INSERT INTO incomes
      (
        account_id,
        source,
        amount,
        description,
        income_date,
        user_id
      )
      VALUES
      (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING *
      `,
      [account_id, source, amount, description, finalDate, userId],
    );

    const income = incomeResult.rows[0];

    // Insert transaction logs
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      `,
      [
        account_id,
        "CREDIT",
        amount,
        oldBalance,
        newBalance,
        "INCOME",
        income.id,
        description || `Income from ${source}`,
        finalDate,
        userId,
      ],
    );

    await client.query("COMMIT");
    return income;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getIncomes = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      i.*,
      a.account_name
    FROM incomes i
    LEFT JOIN accounts a
      ON i.account_id = a.id
    WHERE i.user_id = $1
    ORDER BY i.id DESC
    `,
    [userId],
  );

  return result.rows;
};

const getIncomeById = async (userId, id) => {
  const result = await pool.query(
    `
    SELECT
      i.*,
      a.account_name
    FROM incomes i
    LEFT JOIN accounts a
      ON i.account_id = a.id
    WHERE i.id = $1 AND i.user_id = $2
    `,
    [id, userId],
  );

  return result.rows[0];
};

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
};
