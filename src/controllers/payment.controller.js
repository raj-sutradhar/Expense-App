const paymentService = require("../services/payment.service");

const createPayment = async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getPayments = async (req, res) => {
  try {
    const payments = await paymentService.getPayments(req.user.id);

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.user.id, req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
};