const express = require("express");
const router = express.Router();

const clientController = require("../controllers/client.controller");

const authenticate = require("../middlewares/auth.middleware");

router.post("/", authenticate, clientController.createClient);

router.get("/", authenticate, clientController.getClients);
router.get("/:id", authenticate, clientController.getClientById);
router.patch("/:id", authenticate, clientController.updateClient);

module.exports = router;
