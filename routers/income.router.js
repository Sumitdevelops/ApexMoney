import express, { Router } from 'express'
import { addIncome, getIncome, updateIncome, deleteIncome } from '../controllers/income.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { incomeSchema } from '../validators/schemas.js'

const router = Router()

router.post('/add', requireAuth, validate(incomeSchema), addIncome)
router.get('/get', requireAuth, getIncome)
router.delete('/delete/:incomeId', requireAuth, deleteIncome)
router.put('/update/:incomeId', requireAuth, updateIncome)

export default router