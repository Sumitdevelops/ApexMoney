import { Signup ,login,logout,checkUserSession} from "../controllers/user.controller.js";
import express from 'express'
const router=express.Router()

router.post("/signup",Signup)
router.post('/login',login)
router.get('/session',checkUserSession)
router.post('/logout',logout)


export default router