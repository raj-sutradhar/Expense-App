const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

router.post("/", authenticate, paymentController.createPayment);
router.get("/", authenticate, paymentController.getPayments);

router.get("/:id", authenticate, paymentController.getPaymentById);

module.exports = router;
