const clientService = require("../services/client.service");

const createClient = async (req, res) => {
  try {
    const client = await clientService.createClient(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getClients = async (req, res) => {
  try {
    const clients = await clientService.getClients(req.user.id);

    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getClientById = async (req, res) => {
  try {
    const client = await clientService.getClientById(req.user.id, req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateClient = async (req, res) => {
  try {
    const client = await clientService.updateClient(req.user.id, req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
};