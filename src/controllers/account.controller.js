const accountService = require("../services/account.service");

const createAccount = async (req, res) => {
  try {
    const account = await accountService.createAccount(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await accountService.getAccounts(req.user.id);

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAccountById = async (req, res) => {
  try {
    const account = await accountService.getAccountById(req.user.id, req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateAccount = async (req, res) => {
  try {
    const account = await accountService.updateAccount(req.user.id, req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
};
