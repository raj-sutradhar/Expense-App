const pool = require("../config/db");

const createPayment = async (userId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      client_id,
      account_id,
      paid_amount,
      billing_start,
      billing_end,
      remarks,
      payment_date,
    } = data;
    const finalDate = payment_date ? new Date(payment_date) : new Date();

    // Get client
    const clientResult = await client.query(
      `
      SELECT *
      FROM clients
      WHERE id = $1 AND user_id = $2
      `,
      [client_id, userId],
    );

    if (clientResult.rows.length === 0) {
      throw new Error("Client not found");
    }

    const gymClient = clientResult.rows[0];

    const feeAmount = Number(gymClient.monthly_fee);
    const dueAmount = feeAmount - Number(paid_amount);

    // Get account
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

    const newBalance = oldBalance + Number(paid_amount);

    // Update account balance
    await client.query(
      `
      UPDATE accounts
      SET current_balance = $1
      WHERE id = $2 AND user_id = $3
      `,
      [newBalance, account_id, userId],
    );

    // Insert payment history
    const paymentResult = await client.query(
      `
      INSERT INTO payment_history
      (
        client_id,
        account_id,
        fee_amount,
        paid_amount,
        due_amount,
        billing_start,
        billing_end,
        remarks,
        payment_date,
        user_id
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
      `,
      [
        client_id,
        account_id,
        feeAmount,
        paid_amount,
        dueAmount,
        billing_start,
        billing_end,
        remarks,
        finalDate,
        userId,
      ],
    );

    const payment = paymentResult.rows[0];

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
        "CREDIT",
        paid_amount,
        oldBalance,
        newBalance,
        "PAYMENT",
        payment.id,
        remarks,
        finalDate,
        userId,
      ],
    );

    await client.query("COMMIT");

    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const getPayments = async (userId) => {
  const result = await pool.query(`
    SELECT
      ph.*,
      c.full_name AS client_name,
      a.account_name
    FROM payment_history ph
    LEFT JOIN clients c
      ON ph.client_id = c.id
    LEFT JOIN accounts a
      ON ph.account_id = a.id
    WHERE ph.user_id = $1
    ORDER BY ph.id DESC
  `, [userId]);

  return result.rows;
};
const getPaymentById = async (userId, id) => {
  const result = await pool.query(
    `
    SELECT
      ph.*,
      c.full_name AS client_name,
      a.account_name
    FROM payment_history ph
    LEFT JOIN clients c
      ON ph.client_id = c.id
    LEFT JOIN accounts a
      ON ph.account_id = a.id
    WHERE ph.id = $1 AND ph.user_id = $2
    `,
    [id, userId],
  );

  return result.rows[0];
};
module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
};