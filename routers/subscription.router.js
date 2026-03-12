import express from 'express';
import {
    createSubscription,
    getSubscriptions,
    autoDetectSubscriptions,
    getUpcomingRenewals,
    updateSubscription,
    deleteSubscription
} from '../controllers/subscription.controller.js';
import { subscriptionSchema } from '../validators/subscriptionValidator.js';
import { validate } from '../validators/validate.js';

const router = express.Router();

router.post('/create', validate(subscriptionSchema), createSubscription);
router.get('/get', getSubscriptions);
router.get('/auto-detect', autoDetectSubscriptions);
router.get('/upcoming', getUpcomingRenewals);
router.put('/update/:id', validate(subscriptionSchema), updateSubscription);
router.delete('/delete/:id', deleteSubscription);

export default router;
