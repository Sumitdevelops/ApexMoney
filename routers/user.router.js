import { Signup, login, logout, checkUserSession, requestPasswordReset, verifyOTP, resetPasswordWithOTP, changePassword, deleteAccount, exportData } from "../controllers/user.controller.js";
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema, changePasswordSchema } from '../validators/schemas.js';
import express from 'express'
const router = express.Router()

router.post("/signup", validate(signupSchema), Signup)
router.post('/login', validate(loginSchema), login)
router.get('/session', checkUserSession)
router.post('/logout', logout)
router.post('/forgot-password', requestPasswordReset)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPasswordWithOTP)
router.put('/change-password', requireAuth, validate(changePasswordSchema), changePassword)
router.delete('/delete-account', requireAuth, deleteAccount)
router.get('/export-data', requireAuth, exportData)

export default router