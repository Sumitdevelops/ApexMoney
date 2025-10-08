import express,{Router} from 'express'
import { addExpense } from '../controllers/expense.controller.js'

const router=Router()

router.post('/add',addExpense)

export default router