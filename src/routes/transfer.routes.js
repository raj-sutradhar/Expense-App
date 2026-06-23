const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const transferController = require("../controllers/transfer.controller");

router.post("/", authenticate, transferController.createTransfer);

module.exports = router;
