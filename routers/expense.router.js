import express,{Router} from 'express'
import { addExpense ,getExpenses} from '../controllers/expense.controller.js'

const router=Router()

router.post('/add',addExpense)
router.get('/get',getExpenses)


export default router