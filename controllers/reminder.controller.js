import { BillReminder } from '../models/billReminder.model.js';

// Create bill reminder
export const createReminder = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Calculate next due date
        const now = new Date();
        const dueDate = parseInt(req.body.dueDate);
        const nextDueDate = new Date(now.getFullYear(), now.getMonth(), dueDate);

        if (nextDueDate < now) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        const reminder = await BillReminder.create({
            ...req.body,
            userId,
            nextDueDate
        });

        res.status(201).json(reminder);
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
};

// Get all reminders
export const getReminders = async (req, res) => {
    try {
        const userId = req.session.userId || req.query.userId;
        const { status } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const reminders = await BillReminder.find(query).sort({ nextDueDate: 1 });

        res.json(reminders);
    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
};

// Get upcoming bills
export const getUpcomingBills = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { days = 7 } = req.query;

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        const upcoming = await BillReminder.find({
            userId,
            status: { $in: ['pending', 'overdue'] },
            nextDueDate: {
                $gte: now,
                $lte: futureDate
            }
        }).sort({ nextDueDate: 1 });

        res.json(upcoming);
    } catch (error) {
        console.error('Get upcoming bills error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming bills' });
    }
};

// Mark bill as paid
export const markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const { amount, notes } = req.body;

        const reminder = await BillReminder.findOne({ _id: id, userId });

        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        // Add to payment history
        reminder.paymentHistory.push({
            paidDate: new Date(),
            amount: amount || reminder.amount,
            notes: notes || ''
        });

        reminder.lastPaidDate = new Date();
        reminder.status = 'paid';

        // Calculate next due date if recurring
        if (reminder.recurring) {
            const nextDate = new Date(reminder.nextDueDate);

            if (reminder.frequency === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (reminder.frequency === 'quarterly') {
                nextDate.setMonth(nextDate.getMonth() + 3);
            } else if (reminder.frequency === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else if (reminder.frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            }

            reminder.nextDueDate = nextDate;
            reminder.status = 'pending';
        }

        await reminder.save();

        res.json(reminder);
    } catch (error) {
        console.error('Mark as paid error:', error);
        res.status(500).json({ error: 'Failed to mark bill as paid' });
    }
};

// Update reminder
export const updateReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const reminder = await BillReminder.findOneAndUpdate(
            { _id: id, userId },
            req.body,
            { new: true }
        );

        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        res.json(reminder);
    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
};

// Delete reminder
export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const reminder = await BillReminder.findOneAndDelete({ _id: id, userId });

        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Delete reminder error:', error);
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
};

// Check for overdue bills (can be called by cron job)
export const checkOverdueBills = async (req, res) => {
    try {
        const now = new Date();

        const overdue = await BillReminder.updateMany(
            {
                status: 'pending',
                nextDueDate: { $lt: now }
            },
            {
                $set: { status: 'overdue' }
            }
        );

        res.json({
            message: 'Overdue check completed',
            updated: overdue.modifiedCount
        });
    } catch (error) {
        console.error('Check overdue error:', error);
        res.status(500).json({ error: 'Failed to check overdue bills' });
    }
};
