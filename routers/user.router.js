import { Signup, login, logout, checkUserSession, requestPasswordReset, verifyOTP, resetPasswordWithOTP, deleteAccount } from "../controllers/user.controller.js";
import express from 'express'
const router = express.Router()

router.post("/signup", Signup)
router.post('/login', login)
router.get('/session', checkUserSession)
router.post('/logout', logout)
router.post('/forgot-password', requestPasswordReset)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPasswordWithOTP)
router.delete('/delete-account', deleteAccount)


export default router