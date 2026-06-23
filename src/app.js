const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const clientRoutes = require("./routes/client.routes");
const accountRoutes = require("./routes/account.routes");
const paymentRoutes = require("./routes/payment.routes");
const expenseRoutes = require("./routes/expense.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const transactionRoutes = require("./routes/transaction.routes");
const transferRoutes = require("./routes/transfer.routes");
const incomeRoutes = require("./routes/income.routes");

const app = express();

app.use(cors());
app.use(express.json());



app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/incomes", incomeRoutes);

module.exports = app;
