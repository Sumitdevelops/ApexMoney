import express, { Router } from 'express'
import { addExpense, getExpenses, deleteExpense, updateExpense } from '../controllers/expense.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { expenseSchema } from '../validators/schemas.js'

const router = Router()

router.post('/add', requireAuth, validate(expenseSchema), addExpense)
router.get('/get', requireAuth, getExpenses)
router.delete('/delete/:expenseId', requireAuth, deleteExpense)
router.put('/update/:expenseId', requireAuth, updateExpense)

export default router