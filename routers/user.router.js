import { Signup ,login} from "../controllers/user.controller.js";
import express from 'express'
const router=express.Router()

router.post("/signup",Signup)
router.post('/login',login)

export default router