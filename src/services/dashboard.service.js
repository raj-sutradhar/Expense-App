const pool = require("../config/db");

const getDashboard = async (userId) => {
  const totalClientsResult = await pool.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM clients
    WHERE user_id = $1
  `, [userId]);

  const activeClientsResult = await pool.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM clients
    WHERE status = 'ACTIVE' AND user_id = $1
  `, [userId]);

  const totalBalanceResult = await pool.query(`
    SELECT COALESCE(SUM(current_balance),0) AS total
    FROM accounts
    WHERE user_id = $1
  `, [userId]);

  const allTimeIncomeResult = await pool.query(`
    SELECT (
      SELECT COALESCE(SUM(paid_amount), 0) FROM payment_history WHERE user_id = $1
    ) + (
      SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = $1
    ) AS total
  `, [userId]);

  const monthlyIncomeResult = await pool.query(`
    SELECT (
      SELECT COALESCE(SUM(paid_amount), 0) FROM payment_history 
      WHERE DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE) AND user_id = $1
    ) + (
      SELECT COALESCE(SUM(amount), 0) FROM incomes 
      WHERE DATE_TRUNC('month', income_date) = DATE_TRUNC('month', CURRENT_DATE) AND user_id = $1
    ) AS total
  `, [userId]);

  const allTimeExpenseResult = await pool.query(`
    SELECT COALESCE(SUM(amount),0) AS total
    FROM expenses
    WHERE user_id = $1
  `, [userId]);

  const monthlyExpenseResult = await pool.query(`
    SELECT COALESCE(SUM(amount),0) AS total
    FROM expenses
    WHERE DATE_TRUNC('month', expense_date)
      = DATE_TRUNC('month', CURRENT_DATE) AND user_id = $1
  `, [userId]);

  const totalDueResult = await pool.query(`
    SELECT COALESCE(SUM(due_amount),0) AS total
    FROM payment_history
    WHERE user_id = $1
  `, [userId]);

  return {
    totalClients: totalClientsResult.rows[0].count,

    activeClients: activeClientsResult.rows[0].count,

    totalBalance: Number(totalBalanceResult.rows[0].total),

    allTimeIncome: Number(allTimeIncomeResult.rows[0].total),

    monthlyIncome: Number(monthlyIncomeResult.rows[0].total),

    allTimeExpense: Number(allTimeExpenseResult.rows[0].total),

    monthlyExpense: Number(monthlyExpenseResult.rows[0].total),

    totalDueAmount: Number(totalDueResult.rows[0].total),
  };
};

module.exports = {
  getDashboard,
};
