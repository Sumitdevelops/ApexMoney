import express from 'express';
import {
    createReminder,
    getReminders,
    getUpcomingBills,
    markAsPaid,
    updateReminder,
    deleteReminder,
    checkOverdueBills
} from '../controllers/reminder.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', requireAuth, createReminder);
router.get('/get', requireAuth, getReminders);
router.get('/upcoming', requireAuth, getUpcomingBills);
router.post('/:id/mark-paid', requireAuth, markAsPaid);
router.put('/update/:id', requireAuth, updateReminder);
router.delete('/delete/:id', requireAuth, deleteReminder);
router.post('/check-overdue', requireAuth, checkOverdueBills);

export default router;
