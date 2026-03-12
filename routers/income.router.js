import express,{Router} from 'express'
import { addIncome,getIncome,updateIncome,deleteIncome } from '../controllers/income.controller.js'
import { incomeSchema } from '../validators/incomeValidator.js'
import { validate } from '../validators/validate.js'

const router=Router()

router.post('/add', validate(incomeSchema), addIncome)
router.get('/get',getIncome)
router.delete('/delete/:incomeId',deleteIncome)
router.put('/update/:incomeId', validate(incomeSchema), updateIncome)

export default router