const mongoose = require("mongoose");

async function connectDB() {


    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server is connnect to DB")
    })
    .catch(err =>{
        console.log("Database error",err)
        process.exit(1)
    })
}


module.exports = connectDB;