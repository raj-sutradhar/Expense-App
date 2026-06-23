const transferService = require("../services/transfer.service");

const createTransfer = async (req, res) => {
  try {
    const transfer = await transferService.createTransfer(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTransfer,
};
