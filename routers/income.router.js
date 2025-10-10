import express,{Router} from 'express'
import { addIncome } from '../controllers/income.controller.js'

const router=Router()

router.post('/add',addIncome)

export default router