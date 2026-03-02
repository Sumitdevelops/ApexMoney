import { Subscription } from '../models/subscription.model.js';
import { Expense } from '../models/expense.model.js';

// Create subscription
export const createSubscription = async (req, res) => {
    try {
        const userId = req.session.userId;
        const subscription = await Subscription.create({ ...req.body, userId });
        res.status(201).json(subscription);
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
};

// Get all subscriptions
export const getSubscriptions = async (req, res) => {
    try {
        const userId = req.session.userId || req.query.userId;
        const { status } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const subscriptions = await Subscription.find(query).sort({ nextBillingDate: 1 });

        // Calculate total monthly cost
        const monthlyTotal = subscriptions
            .filter(s => s.status === 'active')
            .reduce((total, sub) => {
                const multipliers = { daily: 30, weekly: 4.33, monthly: 1, quarterly: 0.33, yearly: 0.083 };
                return total + (sub.amount * (multipliers[sub.billingCycle] || 1));
            }, 0);

        const yearlyTotal = subscriptions
            .filter(s => s.status === 'active')
            .reduce((total, sub) => {
                const multipliers = { daily: 365, weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };
                return total + (sub.amount * (multipliers[sub.billingCycle] || 12));
            }, 0);

        res.json({
            subscriptions,
            summary: {
                total: subscriptions.length,
                active: subscriptions.filter(s => s.status === 'active').length,
                monthlyTotal: monthlyTotal.toFixed(2),
                yearlyTotal: yearlyTotal.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
};

// Auto-detect subscriptions from expenses
export const autoDetectSubscriptions = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get all expenses
        const expenses = await Expense.find({ userId }).sort({ date: 1 });

        // Group by merchant/description and look for recurring patterns
        const merchantGroups = {};

        expenses.forEach(expense => {
            const key = (expense.merchant || expense.notes || expense.category).toLowerCase().trim();
            if (!merchantGroups[key]) {
                merchantGroups[key] = [];
            }
            merchantGroups[key].push({
                amount: expense.amount,
                date: new Date(expense.date),
                category: expense.category
            });
        });

        // Detect recurring patterns
        const detectedSubscriptions = [];

        for (const [merchant, transactions] of Object.entries(merchantGroups)) {
            if (transactions.length < 2) continue;

            // Check for consistent amounts
            const amounts = transactions.map(t => t.amount);
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const consistentAmount = amounts.every(amt => Math.abs(amt - avgAmount) < avgAmount * 0.1);

            if (!consistentAmount) continue;

            // Check for regular intervals
            transactions.sort((a, b) => a.date - b.date);
            const intervals = [];
            for (let i = 1; i < transactions.length; i++) {
                const days = Math.round((transactions[i].date - transactions[i - 1].date) / (1000 * 60 * 60 * 24));
                intervals.push(days);
            }

            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            let billingCycle = 'monthly';
            let confidence = 60;

            // Determine billing cycle
            if (avgInterval >= 25 && avgInterval <= 35) {
                billingCycle = 'monthly';
                confidence = 85;
            } else if (avgInterval >= 85 && avgInterval <= 95) {
                billingCycle = 'quarterly';
                confidence = 80;
            } else if (avgInterval >= 360 && avgInterval <= 370) {
                billingCycle = 'yearly';
                confidence = 85;
            } else if (avgInterval >= 6 && avgInterval <= 8) {
                billingCycle = 'weekly';
                confidence = 75;
            }

            if (confidence >= 75) {
                // Calculate next billing date
                const lastTransaction = transactions[transactions.length - 1];
                const nextBilling = new Date(lastTransaction.date);
                const daysToAdd = billingCycle === 'monthly' ? 30 :
                    billingCycle === 'quarterly' ? 90 :
                        billingCycle === 'yearly' ? 365 : 7;
                nextBilling.setDate(nextBilling.getDate() + daysToAdd);

                // Check if already exists
                const existing = await Subscription.findOne({
                    userId,
                    name: { $regex: new RegExp(merchant, 'i') }
                });

                if (!existing) {
                    detectedSubscriptions.push({
                        name: merchant.charAt(0).toUpperCase() + merchant.slice(1),
                        amount: avgAmount,
                        billingCycle,
                        nextBillingDate: nextBilling,
                        category: transactions[0].category,
                        autoDetected: true,
                        confidence,
                        transactionCount: transactions.length
                    });
                }
            }
        }

        res.json({
            detected: detectedSubscriptions.length,
            subscriptions: detectedSubscriptions
        });
    } catch (error) {
        console.error('Auto-detect error:', error);
        res.status(500).json({ error: 'Failed to detect subscriptions' });
    }
};

// Get upcoming renewals
export const getUpcomingRenewals = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { days = 7 } = req.query;

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        const upcoming = await Subscription.find({
            userId,
            status: 'active',
            nextBillingDate: {
                $gte: now,
                $lte: futureDate
            }
        }).sort({ nextBillingDate: 1 });

        res.json(upcoming);
    } catch (error) {
        console.error('Get upcoming renewals error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming renewals' });
    }
};

// Update subscription
export const updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const subscription = await Subscription.findOneAndUpdate(
            { _id: id, userId },
            req.body,
            { new: true }
        );

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json(subscription);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ error: 'Failed to update subscription' });
    }
};

// Delete subscription
export const deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const subscription = await Subscription.findOneAndDelete({ _id: id, userId });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        console.error('Delete subscription error:', error);
        res.status(500).json({ error: 'Failed to delete subscription' });
    }
};
