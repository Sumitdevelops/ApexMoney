import { Signup } from "../controllers/user.controller.js";
import express from 'express'
const router=express.Router()



const userRouter=router.post("/signup",Signup)

export default userRouter