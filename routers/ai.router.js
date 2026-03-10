import express from 'express';
import {
    categorizeExpense,
    generateInsights,
    predictSpending,
    getBudgetRecommendations,
    markInsightRead,
    dismissInsight,
    aiChat,
    scanReceipt
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// AI endpoints
router.post('/categorize', requireAuth, categorizeExpense);
router.get('/insights', requireAuth, generateInsights);
router.get('/predictions', requireAuth, predictSpending);
router.get('/budget-recommendations', requireAuth, getBudgetRecommendations);
router.patch('/insights/:insightId/read', requireAuth, markInsightRead);
router.patch('/insights/:insightId/dismiss', requireAuth, dismissInsight);
router.post('/chat', requireAuth, aiChat);
router.post('/scan-receipt', requireAuth, scanReceipt);

export default router;
