import express,{Router} from 'express'
import { addExpense ,getExpenses,deleteExpense, updateExpense} from '../controllers/expense.controller.js'
import { expenseSchema } from '../validators/expenseValidator.js'
import { validate } from '../validators/validate.js'

const router=Router()

router.post('/add', validate(expenseSchema), addExpense)
router.get('/get',getExpenses)
router.delete('/delete/:expenseId',deleteExpense)
router.put('/update/:expenseId', validate(expenseSchema), updateExpense)



export default router