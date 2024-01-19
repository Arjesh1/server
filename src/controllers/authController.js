import { StatusCodes } from "http-status-codes"
import User from "../models/authModel.js"
import { comparePassword, hashPassword } from "../utils/bcrypt.js"
import { createJWT, verifyJWT } from "../utils/tokenUtils.js"


export const registerUser = async(req, res)=>{
    const {name, email, goal, profileImg, password} = req.body
    const emailExist = await User.findOne({email:email})
    if(emailExist){
         return res.status(StatusCodes.UNAUTHORIZED).json({message: "Email already registered!"})
    }
    const hashedPassword =  hashPassword(password)
    const newUser = await User.create({name, email, goal, profileImg, hashedPassword})
    const token = createJWT({_id: newUser.id})
    res.status(StatusCodes.OK).json({
        _id:token, 
        name: newUser.name,
        email: newUser.email,
        goal: newUser.goal,
        profileImg: newUser.profileImg, })
}

export const loginUser = async(req, res)=>{
    try {
        const {email, password} = req.body
        const user = await User.findOne({email:email})
        if(!user){
        res.status(401).json({ message: "Authentication failed. No user found" });
    }
    if(!comparePassword(password,user.hashedPassword)){
        res.status(401).json({ message: "Authentication failed. Wrong Password" });
    }
      const token = createJWT({_id: user.id})
  
    return res.json({ id:token, email:user.email, name:user.email, goal:user.goal, profileImg: user.profileImg});
        
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const updateUserDetails = async (req, res)=>{
    try {
      const token = req.params.token
      const decodedJWT = await verifyJWT(token)
      if(decodedJWT && decodedJWT._id){
        const foundUser = await User.findById(decodedJWT._id)
        if(foundUser){
            const updateDetails = await User.findOneAndUpdate(
                {_id: foundUser._id},
                req.body,
                { new: true }
            )
            return res.status(200).json({updateDetails})
        }
      }
      res.status(401).json({message: 'SomeThing went worng.'})
        
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
