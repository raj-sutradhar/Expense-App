const pool = require("../config/db");

const createClient = async (userId, data) => {
  const { full_name, phone, monthly_fee } = data;

  const result = await pool.query(
    `
      INSERT INTO clients
      (
        full_name,
        phone,
        monthly_fee,
        user_id
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `,
    [full_name, phone, monthly_fee, userId],
  );

  return result.rows[0];
};
const getClients = async (userId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM clients
      WHERE user_id = $1
      ORDER BY id DESC
    `,
    [userId]
  );

  return result.rows;
};

const getClientById = async (userId, id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM clients
      WHERE id = $1 AND user_id = $2
    `,
    [id, userId],
  );

  return result.rows[0];
};
const updateClient = async (userId, id, data) => {
  const { full_name, phone, monthly_fee, status } = data;

  const result = await pool.query(
    `
    UPDATE clients
    SET
      full_name = $1,
      phone = $2,
      monthly_fee = $3,
      status = $4,
      updated_at = NOW()
    WHERE id = $5 AND user_id = $6
    RETURNING *
    `,
    [full_name, phone, monthly_fee, status, id, userId],
  );

  return result.rows[0];
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
};