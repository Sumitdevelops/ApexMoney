import express,{Router} from 'express'
import { addIncome,getIncome } from '../controllers/income.controller.js'

const router=Router()

router.post('/add',addIncome)
router.get('/get',getIncome)


export default router