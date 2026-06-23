const pool = require("../config/db");

const getTransactions = async (userId) => {
  const result = await pool.query(`
    SELECT
      t.*,
      a.account_name
    FROM transactions t
    LEFT JOIN accounts a
      ON t.account_id = a.id
    WHERE t.user_id = $1
    ORDER BY t.id DESC
  `, [userId]);

  return result.rows;
};

const getTransactionById = async (userId, id) => {
  const result = await pool.query(
    `
    SELECT
      t.*,
      a.account_name
    FROM transactions t
    LEFT JOIN accounts a
      ON t.account_id = a.id
    WHERE t.id = $1 AND t.user_id = $2
    `,
    [id, userId],
  );

  return result.rows[0];
};

module.exports = {
  getTransactions,
  getTransactionById,
};
