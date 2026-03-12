import express from 'express';
import {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    getGoalInsights
} from '../controllers/goal.controller.js';
import { goalSchema } from '../validators/goalValidator.js';
import { validate } from '../validators/validate.js';

const router = express.Router();

router.post('/create', validate(goalSchema), createGoal);
router.get('/get', getGoals);
router.put('/update/:id', validate(goalSchema), updateGoal);
router.delete('/delete/:id', deleteGoal);
router.get('/:id/insights', getGoalInsights);

export default router;
