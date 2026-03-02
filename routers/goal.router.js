import express from 'express';
import {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    getGoalInsights
} from '../controllers/goal.controller.js';

const router = express.Router();

router.post('/create', createGoal);
router.get('/get', getGoals);
router.put('/update/:id', updateGoal);
router.delete('/delete/:id', deleteGoal);
router.get('/:id/insights', getGoalInsights);

export default router;
