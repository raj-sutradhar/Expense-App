const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");

const accountController = require("../controllers/account.controller");

router.post("/", authenticate, accountController.createAccount);

router.get("/", authenticate, accountController.getAccounts);

router.get("/:id", authenticate, accountController.getAccountById);

router.patch("/:id", authenticate, accountController.updateAccount);

module.exports = router;
