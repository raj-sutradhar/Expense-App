const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const expenseController = require("../controllers/expense.controller");

router.post("/", authenticate, expenseController.createExpense);
router.get("/", authenticate, expenseController.getExpenses);

router.get("/:id", authenticate, expenseController.getExpenseById);

module.exports = router;
