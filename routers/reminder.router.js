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

const router = express.Router();

router.post('/create', createReminder);
router.get('/get', getReminders);
router.get('/upcoming', getUpcomingBills);
router.post('/:id/mark-paid', markAsPaid);
router.put('/update/:id', updateReminder);
router.delete('/delete/:id', deleteReminder);
router.post('/check-overdue', checkOverdueBills);

export default router;
