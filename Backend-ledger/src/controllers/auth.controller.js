const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs")
const tokenBlackListModel = require("../models/blackList.model")

/**
* - user register controller
* - POST/api/auth/register
*/
async function userRegisterController(req,res) {
    
    const {email , name , password} = req.body;

    const isExists = await userModel.findOne({
        email:email
    });

    if(isExists){
        return res.status(422).json({
            message:"User already exists with email.",
            status:"failed"
        })
    }

    const user = await userModel.create({
        email, name, password
    })

    const token = jwt.sign({
        userId: user._id 
    }, process.env.JWT_SECRET ,{ expiresIn:"3d"});

    res.cookie("token",token)

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })
}

/**
* - user login controller
* - POST/api/auth/login
*/
async function userLoginController(req,res) {
    
    const {email,password} = req.body;

    const user = await userModel.findOne({ email }).select("+password");
    // console.log(user)
    // console.log(user.password)       

    if (!user) {
        return res.status(401).json({
            message:"Not exists user in this email",
            status:"failed"
        })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
        res.status(401).json({
            message:"Wrong password",
            status:"failed"
        })
    }

    const token = jwt.sign({
        userId : user._id
    },process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token);

    res.status(200).json({
        message:`${user.name} login success`,
        status:"success"
    })

}  


/**
 * user logout controller
 * POST /api/auth/logout
 */
async function userLogoutController(req,res) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if(!token){
        return res.status(200).json({
            message: "User logout successfully"
        })
    }
    res.clearCookie("token");
    const blacklistToken = await tokenBlackListModel.create({
        token: token
    })
    res.status(200).json({
            message: "User logout successfully"
    })

}


module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}