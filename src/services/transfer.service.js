const pool = require("../config/db");

const createTransfer = async (userId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { from_account_id, to_account_id, amount, remarks } = data;

    if (from_account_id === to_account_id) {
      throw new Error("Cannot transfer to same account");
    }

    const fromResult = await client.query(
      `
      SELECT *
      FROM accounts
      WHERE id = $1 AND user_id = $2
      `,
      [from_account_id, userId],
    );

    const toResult = await client.query(
      `
      SELECT *
      FROM accounts
      WHERE id = $1 AND user_id = $2
      `,
      [to_account_id, userId],
    );

    if (!fromResult.rows.length) {
      throw new Error("Source account not found");
    }

    if (!toResult.rows.length) {
      throw new Error("Destination account not found");
    }

    const fromAccount = fromResult.rows[0];

    const toAccount = toResult.rows[0];

    const oldFromBalance = Number(fromAccount.current_balance);

    const oldToBalance = Number(toAccount.current_balance);

    if (oldFromBalance < Number(amount)) {
      throw new Error("Insufficient balance");
    }

    const newFromBalance = oldFromBalance - Number(amount);

    const newToBalance = oldToBalance + Number(amount);

    await client.query(
      `
      UPDATE accounts
      SET current_balance = $1
      WHERE id = $2 AND user_id = $3
      `,
      [newFromBalance, from_account_id, userId],
    );

    await client.query(
      `
      UPDATE accounts
      SET current_balance = $1
      WHERE id = $2 AND user_id = $3
      `,
      [newToBalance, to_account_id, userId],
    );

    const transferResult = await client.query(
      `
        INSERT INTO account_transfers
        (
          from_account_id,
          to_account_id,
          amount,
          remarks,
          user_id
        )
        VALUES
        (
          $1,$2,$3,$4,$5
        )
        RETURNING *
        `,
      [from_account_id, to_account_id, amount, remarks, userId],
    );

    const transfer = transferResult.rows[0];

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
        user_id
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      `,
      [
        from_account_id,
        "DEBIT",
        amount,
        oldFromBalance,
        newFromBalance,
        "TRANSFER",
        transfer.id,
        remarks,
        userId,
      ],
    );

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
        user_id
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      `,
      [
        to_account_id,
        "CREDIT",
        amount,
        oldToBalance,
        newToBalance,
        "TRANSFER",
        transfer.id,
        remarks,
        userId,
      ],
    );

    await client.query("COMMIT");

    return transfer;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createTransfer,
};
