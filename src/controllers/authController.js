import { StatusCodes } from "http-status-codes"
import User from "../models/authModel.js"
import { comparePassword, hashPassword } from "../utils/bcrypt.js"
import { createJWT, verifyJWT } from "../utils/tokenUtils.js"
import { RESPONSE_MESSAGES } from "../utils/constants.js"

export const registerUser = async(req, res)=>{
    try {
        const {name, email, goal, profileImg, password} = req.body
        const emailExist = await User.findOne({email:email})
        if(emailExist){
         return res.status(StatusCodes.UNAUTHORIZED).json({message: "Email already registered!"})
        }
        const hashedPassword =  hashPassword(password)
        const newUser = await User.create({name, email, goal, profileImg, hashedPassword})
        const userData = { 
           name: newUser.name,
           email: newUser.email,
           goal: newUser.goal,
           profileImg: newUser.profileImg
        }
        const token = createJWT({_id: newUser.id})
        return res.status(StatusCodes.OK).json({userData, token })
    } catch (error) {
        console.log(error)
        return res.status(StatusCodes.GATEWAY_TIMEOUT).json({message: RESPONSE_MESSAGES.ErrorMessage})
    }
}

export const loginUser = async(req, res)=>{
    try {
        const {email, password} = req.body
        const user = await User.findOne({email:email})
        if(!user){
        return res.status(StatusCodes.NOT_FOUND).json({ message: "No user found" });
    }
    if(!comparePassword(password,user.hashedPassword)){
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Authentication failed. Wrong Password" });
    }
      const token = createJWT({_id: user.id})
      const userData = { 
        email:user.email, 
        name:user.name, 
        goal:user.goal, 
        profileImg: user.profileImg
    }
    return res.status(StatusCodes.OK).json({ userData, token});
        
    } catch (error) {
        console.log(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: RESPONSE_MESSAGES.ErrorMessage });
    }
}

export const updateUserDetails = async (req, res)=>{
    try {
      const receivedToken = req.body.token
      const decodedJWT = await verifyJWT(receivedToken)
      if(!decodedJWT || !decodedJWT._id){
        return res.status(StatusCodes.UNAUTHORIZED).json({message: RESPONSE_MESSAGES.ErrorMessage}) 
      }
        const user = await User.findById(decodedJWT._id)
        const allUsers = await User.find()
        const otherUsers = allUsers.filter((currentUser) => currentUser._id.toString() !== user._id.toString());
        const checkDuplicateEmail = otherUsers.find((otherUser) => otherUser.email === req.body.userData.email)

        if(checkDuplicateEmail){
            return res.status(StatusCodes.UNAUTHORIZED).json({message: "Email already registered!"})
        }

        if(!user){
            return res.status(401).json({message: RESPONSE_MESSAGES.ErrorMessage})

        }
        const updateDetails = await User.findOneAndUpdate(
                {_id: user._id},
                req.body.userData,
                { new: true }
        )

        const token = createJWT({_id: updateDetails.id})

        const updatedUserData = { 
              email:updateDetails.email, 
              name:updateDetails.name, 
              goal:updateDetails.goal, 
              profileImg: updateDetails.profileImg
        }
        return res.status(200).json({ updatedUserData, token})
    } catch (error) {
        console.error('Error updating user details:', error);
        return res.status(500).json({ message: RESPONSE_MESSAGES.ErrorMessage });
    }
}

export const changePassword = async (req, res) =>{
    const token = req.body.token
    const confirmNewPassword =  req.body.passwordChangeData.confirmNewPassword
    const password =  req.body.passwordChangeData.oldPassword
    const newPassword =  req.body.passwordChangeData.newPassword

    try {
        if(newPassword !== confirmNewPassword ){
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({message: 'Password and confirm password do not match'})
        }
        const decodedJWT = await verifyJWT(token)
        if(!decodedJWT || !decodedJWT._id){
            return res.status(StatusCodes.BAD_REQUEST).json({message: RESPONSE_MESSAGES.ErrorMessage })

        }
          const user = await User.findById(decodedJWT._id)
          if(user){
            if(!comparePassword(password, user.hashedPassword)){
                return res.status(401).json({ message: "Authentication failed. Wrong Password" });
            }
            const hashedNewPassword = hashPassword(newPassword)
            await User.findOneAndUpdate(
                  {_id: user._id},
                  {$set: { hashedPassword: hashedNewPassword } },
                  { new: true }
              )
              return res.status(200).json({success: 'Password has been updated'})
          }
      } catch (error) {
          console.error(error);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: RESPONSE_MESSAGES.ErrorMessage });
      }

      

}

export const uploadProfileImg = async(req, res)=>{
    
}
