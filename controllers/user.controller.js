import bcrypt from 'bcrypt'
import  {User} from '../models/user.model.js'

 export const Signup= async (req,res)=>{
    const {email,password}=req.body
    const existingUser=await User.findOne({email})
    if (existingUser) {
        res.status(400).json({message:"Email already registered"})
    }
    const hashedPassword=await bcrypt.hash(password,10)

    if (!hashedPassword) {
        res.status(500).json({message:"Email already registered"})
        
    }

    const newUser=  new User({email,password:hashedPassword})
    await newUser.save()

   req.session.userId=newUser._id
   if (!req.session.userId) {
    console.log("no");
    
   }
    res.status(200).json({message:"Email already registered"})

 } 