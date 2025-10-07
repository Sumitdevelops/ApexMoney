import { Signup ,login,checkUserSession} from "../controllers/user.controller.js";
import express from 'express'
const router=express.Router()

router.post("/signup",Signup)
router.post('/login',login)
router.post('/session',checkUserSession)

export default router