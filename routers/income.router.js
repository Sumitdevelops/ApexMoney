import express,{Router} from 'express'
import { addIncome,getIncome,updateIncome,deleteIncome } from '../controllers/income.controller.js'

const router=Router()

router.post('/add',addIncome)
router.get('/get',getIncome)
router.delete('/delete/:incomeId',deleteIncome)
router.put('/update/:incomeId',updateIncome)

export default router