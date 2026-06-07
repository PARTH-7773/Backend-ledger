const accountModel = require("../models/account.model");
const { populate } = require("../models/transaction.model");

async function createAccountController(req, res) {
  const user = req.user;
  console.log(user);

  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    account,
  });
}

async function getUserAccountsController(req, res) {
  const account = await accountModel
    .find({ user: req.user.id })
    .populate("user", "email");

  res.status(200).json({
    message: "Account fetched success.",
    account,
  });
}

async function getAccountBalanceController(req, res) {
  const accountId = req.params.accountId;

  console.log(accountId);

  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user._id,
  }).populate("user","name")

  if (!account) {
    return res.status(404).json({
      message: "Account not found",
    });
  }

  const balance = await account.getBalance();

  res.status(200).json({
    accountId: account._id,
    Name: account.user.name, 
    balance,
  });
}

module.exports = {
  createAccountController,
  getUserAccountsController,
  getAccountBalanceController,
};
