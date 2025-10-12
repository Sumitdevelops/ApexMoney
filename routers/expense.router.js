import express,{Router} from 'express'
import { addExpense ,getExpenses,deleteExpense, updateExpense} from '../controllers/expense.controller.js'

const router=Router()

router.post('/add',addExpense)
router.get('/get',getExpenses)
router.delete('/delete/:expenseId',deleteExpense)
router.put('/update/:expenseId',updateExpense)



export default router