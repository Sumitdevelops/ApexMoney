import bcrypt from 'bcrypt'
import  {User} from '../models/user.model.js'

 export const Signup= async (req,res)=>{
    console.log("Received signup request with body:", req.body)
    const {name,email,password}=req.body
    try {
        const existingUser=await User.findOne({email})
        if (existingUser) {
           return res.status(400).json({message:"Email already registered"})
        }
        const hashedPassword=await bcrypt.hash(password,10)
    
        if (!hashedPassword) {
           return res.status(500).json({message:"password not hashed"})
            
        }
    
        const newUser=await User.create({
            name,
            email,
            password:hashedPassword
        })
    
       req.session.userId=newUser?._id

        const userToReturn = await User.findById(newUser._id).select("-password");
       
        return res.status(200).json({User:userToReturn,message:"user registered"})
    } catch (error) {
     console.log("signup error:",error);
     return res.status(500).json({message:"Unable to Signup"})
        
    }

 } 

 export const login=async(req,res)=>{
    const {email,password}=req.body
    try {
        if (!email||!password) {
           return res.status(400).json({message:"Both fields are required"})
        }
    
        const user=await User.findOne({email})
        if (!user) {
             return res.status(401).json({message:"User not registered"})
        }
    
        const isPasswordCorrect=await bcrypt.compare(password, user?.password)
    
        if (isPasswordCorrect===false) {
            return res.status(400).json({message:"password incorrect"})
            
        }
        const loggedInUser=await User.findById(user._id).select("-password")
        req.session.userId=user?._id
   
        return res.status(200).json({User:loggedInUser,message:'User LoggedIn successfully'})
    
    } catch (error) {
        console.log("login error: ",error);
        return res.status(500).json({message:"unexpected login issue"})
        
    }
 }

 export const logout=(req,res)=>{
    if (req.session) {
        req.session.destroy((err)=>{
            
            if (err) {
                return res.status(500).json({message:"internal server error"})
            }
            res.clearCookie('connect.sid')
            return res.status(200).json({message:"User logged out successfully"})
            
            
        })
    }else{
        return res.status(400).json({message:"no session available"})
    }
 }

 export const changePassword=async(req,res)=>{
    try {
        if (!req.session.userId) {
            return res.status(400).json({message:"user not logged in"})
        }
        const {oldPassword,newPassword}=req.body
        if (oldPassword===newPassword) {
            return res.status(400).json({message:"please give different passwords"})
        }
        if (!oldPassword || !newPassword) {
           return res.status(400).json({message:"Please give both the fields"})
        }
    
        const user= await User.findById(req.session.userId)
    
        const isPasswordCorrect= await bcrypt.compare(oldPassword,user.password)
    
        if (!isPasswordCorrect) {
           return res.status(400).json({message:"incorrect old password"})
        }
    
        const newHashedPassword=await bcrypt.hash(newPassword,10)
        await User.findByIdAndUpdate(
            user._id,
            {
                $set:{password:newHashedPassword}
            },
            {
                new:true
            }
        )
    
        return res.status(200).json({message:"password changed successfully"})
    
    } catch (error) {
        console.log("password change error",error);
        return res.status(500).json({message:'internal server error'})
        
    }
 }

 export const checkUserSession=async(req,res)=>{
    if (!req.session.userId) {
       return res.status(401).json({message:"User not logged in"})
    }

    const user= await User.findById(req.session.userId).select("-password")

    if (!user) {
       return res.status(400).json({message:"user not found while checking session"})
    }
      return res.status(200).json({user:user,message:"Session available"})

 }

 