const express = require("express");
const cookieParser = require("cookie-parser")

const app = express();
app.use(express.json());
app.use(cookieParser());


/**
 * - Routes required
 */
const authrouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.route")
const transactionRouter = require("./routes/transaction.route")



/**
 * - Use Router
 */
app.use("/api/auth",authrouter);
app.use("/api/accounts",accountRouter)
app.use("/api/transaction",transactionRouter)


module.exports = app;