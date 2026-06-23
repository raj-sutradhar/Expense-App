const expenseService = require("../services/expense.service");

const createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getExpenses = async (req, res) => {
  try {
    const expenses = await expenseService.getExpenses(req.user.id);

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getExpenseById = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.user.id, req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
};
