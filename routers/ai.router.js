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

const router = express.Router();

// AI endpoints
router.post('/categorize', categorizeExpense);
router.get('/insights', generateInsights);
router.get('/predictions', predictSpending);
router.get('/budget-recommendations', getBudgetRecommendations);
router.patch('/insights/:insightId/read', markInsightRead);
router.patch('/insights/:insightId/dismiss', dismissInsight);
router.post('/chat', aiChat);
router.post('/scan-receipt', scanReceipt);

export default router;
