import express from 'express';
import {
    createSubscription,
    getSubscriptions,
    autoDetectSubscriptions,
    getUpcomingRenewals,
    updateSubscription,
    deleteSubscription
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.post('/create', createSubscription);
router.get('/get', getSubscriptions);
router.get('/auto-detect', autoDetectSubscriptions);
router.get('/upcoming', getUpcomingRenewals);
router.put('/update/:id', updateSubscription);
router.delete('/delete/:id', deleteSubscription);

export default router;
