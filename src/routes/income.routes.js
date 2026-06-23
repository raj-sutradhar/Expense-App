const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const incomeController = require("../controllers/income.controller");

router.post("/", authenticate, incomeController.createIncome);
router.get("/", authenticate, incomeController.getIncomes);
router.get("/:id", authenticate, incomeController.getIncomeById);

module.exports = router;
