const incomeService = require("../services/income.service");

const createIncome = async (req, res) => {
  try {
    const income = await incomeService.createIncome(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getIncomes = async (req, res) => {
  try {
    const incomes = await incomeService.getIncomes(req.user.id);

    res.status(200).json({
      success: true,
      data: incomes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getIncomeById = async (req, res) => {
  try {
    const income = await incomeService.getIncomeById(req.user.id, req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
};
