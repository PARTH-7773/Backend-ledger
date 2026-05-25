const mongoose = require("mongoose");
const UUID = require("uuid") 


const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const email = require("../services/email.service");

/**
 * Generate idempotency Key with UUID package
 */
let key ;
function generateIdempotencyKey() {
    key = UUID.v7()
}

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW
      * 1.Validate request
      * 2.Validate idempotency Key
      * 3.Check account status
      * 4.Derive sender balance from ladger
      * 5.Create transaction (PENDING)
      * 6.Create DEBIT ladger entry
      * 7.Create CREDIT ladger entry
      * 8.Mark transaction COMPLETED
      * 9.Commit MongoDB session
      * 10.Send email notification 
 */

generateIdempotencyKey()
async function createTransaction(req,res) {
    const {fromAccount, toAccount, amount, idempotencyKey= key} = req.body;
    
    /**
     * 1.Validate request
     */
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "Please fill all the required credentials"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user:req.user._id
    }).populate("user","email")

    // console.log(fromUserAccount)


    const toUserAccount = await accountModel.findOne({
        _id:toAccount
    }).populate("user","email")

    // console.log(toUserAccount);
    

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    if (amount < 1) {
        return res.status(400).json({
            message: "Please enter a positive amounts(>= 1)."
        })
    }

    /**
     * 2.validate idempotency key
     */

    const istransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })
 
    if (istransactionAlreadyExists) {
        if (istransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
            message: "Transaction already processed",
            transaction: istransactionAlreadyExists 
            }) 
        }
        if (istransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transation is still processing"
            })
        }
        if (istransactionAlreadyExists.status === "FAILED") {
            return res.status(200).json({
                message: "Transaction processing failed, please retry"
            })
        }
        if(istransactionAlreadyExists.status === "REVERSED"){
            return res.status(200).json({
                message: "Transaction was reversed, please retry"
            })
        } 
    }

    /**
      * 3.Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }


    /**
      * 4.Derive sender balance from ladger
     */
    const balance = await fromUserAccount.getBalance()
    // console.log(balance)

 
    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance, Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction ;
    try{
        /**
         * 5.Create transaction (PENDING)
         */

        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = await transactionModel.create({
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            idempotencyKey: idempotencyKey,
            status: "PENDING"
        })

        console.log(transaction)
        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount :amount,
            transaction:transaction._id,
            type:"DEBIT"
        }],{ session })
        console.log("hello")

        await (()=>{
            return new Promise((resolve)=> setTimeout(resolve, 15 * 1000))
        })()

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction:transaction._id,
            type:"CREDIT"
        }],{ session })

        await transactionModel.findOneAndUpdate(
            {_id: transaction._id},
            {status: "COMPLETED"},
            {session}
        )

        await session.commitTransaction()
        session.endSession()

    }catch(err){

        return res.status(400).json({
            message: "Transaction is Panding due to some issue, please retry after some time",
            err
        })
    }


        /**
         * 10.Send email notification 
         */


    return res.status(201).json({
        message:"Transaction completed successfully",
        transaction: transaction
    })
    

}


async function createInitialFundsTrasaction(req, res) {
    
    const {toAccount, amount, idempotencyKey = key} = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "All field are required, Please fill it."
        })
    }
    
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })
    
    // console.log(toUserAccount);
    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user:req.user._id
    })

    // console.log(fromUserAccount)
    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const istransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })

    if (istransactionAlreadyExists) {
        if (istransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
            message: "Transaction already processed",
            transaction: istransactionAlreadyExists 
            }) 
        }
        if (istransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transation is still processing"
            })
        }
        if (istransactionAlreadyExists.status === "FAILED") {
            return res.status(200).json({
                message: "Transaction processing failed, please retry"
            })
        }
        if(istransactionAlreadyExists.status === "REVERSED"){
            return res.status(200).json({
                message: "Transaction was reversed, please retry"
            })
        } 
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount:fromUserAccount._id,
        toAccount:toUserAccount._id,
        amount,
        status:"PENDING",    
        idempotencyKey
    })
    

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id, 
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT" 
    }], {session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ] , {session})


    transaction.status = "COMPLETED"

    await transaction.save({session})

    await session.commitTransaction()
    await session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })


}


module.exports = {
    createTransaction,
    createInitialFundsTrasaction,
}