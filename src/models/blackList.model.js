const mongoose = require("mongoose");
const { create } = require("./transaction.model");

const tokenBlackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true,"Token is required to blacklist"],
        unique: [true, "Token is already blacklisted"]
    }
},{
    timestamps: true
})

tokenBlackListSchema.index({ createAt: 1},{
    expireAfterSeconds: 60 * 60 * 24 * 3
})

const tokenBlackListModel = mongoose.model("tokenBlackList",tokenBlackListSchema);


module.exports = tokenBlackListModel;