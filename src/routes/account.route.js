const {Router} = require("express");
const authMiddleware =  require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")


const router = Router();


/**
 * - POST/api/account
 * - create a new account
 * - Protected Route
 */
router.post("/",authMiddleware.authMiddleware ,accountController.createAccountController)

/**
 * GET/api/account
 * Get user account
 */
router.get("/", authMiddleware.authMiddleware,accountController.getUserAccountsController)

/**
 * GET /api/account/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware ,accountController.getAccountBalanceController)





module.exports = router;