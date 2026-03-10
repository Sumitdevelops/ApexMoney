import express from 'express';
import {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    getGoalInsights
} from '../controllers/goal.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { goalSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/create', requireAuth, validate(goalSchema), createGoal);
router.get('/get', requireAuth, getGoals);
router.put('/update/:id', requireAuth, updateGoal);
router.delete('/delete/:id', requireAuth, deleteGoal);
router.get('/:id/insights', requireAuth, getGoalInsights);

export default router;
