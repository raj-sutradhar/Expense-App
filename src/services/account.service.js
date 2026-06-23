const pool = require("../config/db");

const createAccount = async (userId, data) => {
  const {
    bank_id,
    account_name,
    account_number,
    current_balance,
    account_type,
  } = data;

  const result = await pool.query(
    `
    INSERT INTO accounts
    (
      bank_id,
      account_name,
      account_number,
      current_balance,
      account_type,
      user_id
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [bank_id, account_name, account_number, current_balance, account_type, userId],
  );

  return result.rows[0];
};
const getAccounts = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      a.*,
      b.name AS bank_name
    FROM accounts a
    LEFT JOIN banks b
    ON a.bank_id = b.id
    WHERE a.user_id = $1
    ORDER BY a.id DESC
    `,
    [userId]
  );

  return result.rows;
};
const getAccountById = async (userId, id) => {
  const result = await pool.query(
    `
    SELECT
      a.*,
      b.name as bank_name
    FROM accounts a
    LEFT JOIN banks b
    ON a.bank_id = b.id
    WHERE a.id = $1 AND a.user_id = $2
    `,
    [id, userId],
  );

  return result.rows[0];
};
const updateAccount = async (userId, id, data) => {
  const {
    bank_id,
    account_name,
    account_number,
    current_balance,
    account_type,
  } = data;

  const result = await pool.query(
    `
    UPDATE accounts
    SET
      bank_id = $1,
      account_name = $2,
      account_number = $3,
      current_balance = $4,
      account_type = $5
    WHERE id = $6 AND user_id = $7
    RETURNING *
    `,
    [bank_id, account_name, account_number, current_balance, account_type, id, userId],
  );

  return result.rows[0];
};
module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
};
