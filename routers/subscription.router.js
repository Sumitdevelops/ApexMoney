import express from 'express';
import {
    createSubscription,
    getSubscriptions,
    autoDetectSubscriptions,
    getUpcomingRenewals,
    updateSubscription,
    deleteSubscription
} from '../controllers/subscription.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { subscriptionSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/create', requireAuth, validate(subscriptionSchema), createSubscription);
router.get('/get', requireAuth, getSubscriptions);
router.get('/auto-detect', requireAuth, autoDetectSubscriptions);
router.get('/upcoming', requireAuth, getUpcomingRenewals);
router.put('/update/:id', requireAuth, updateSubscription);
router.delete('/delete/:id', requireAuth, deleteSubscription);

export default router;
