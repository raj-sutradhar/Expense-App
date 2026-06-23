const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

router.get("/", authenticate, transactionController.getTransactions);

router.get("/:id", authenticate, transactionController.getTransactionById);

module.exports = router;
