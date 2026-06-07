const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller")

const transactionRouter = Router();


/**
 * - POST /api/transaction
 * - Create a new transaction
 */
transactionRouter.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)


/**
 * - POST /api/transaction/system/initial-funds
 * - Create initital finds transaction from system user
 */
transactionRouter.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTrasaction)





module.exports = transactionRouter;