import { FinancialGoal } from '../models/financialGoal.model.js';

// Create a new financial goal
export const createGoal = async (req, res) => {
    try {
        const userId = req.session.userId;
        const goalData = { ...req.body, userId };

        const goal = await FinancialGoal.create(goalData);
        res.status(201).json(goal);
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
};

// Get all goals for a user
export const getGoals = async (req, res) => {
    try {
        const userId = req.session.userId || req.query.userId;

        const goals = await FinancialGoal.find({ userId }).sort({ createdAt: -1 });

        // Calculate progress for each goal
        const goalsWithProgress = goals.map(goal => ({
            ...goal.toObject(),
            progressPercentage: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(1),
            remainingAmount: Math.max(goal.targetAmount - goal.currentAmount, 0).toFixed(2),
            daysRemaining: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        }));

        res.json(goalsWithProgress);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
};

// Update goal progress
export const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const updates = req.body;

        // Check if we're adding to current amount
        if (updates.addAmount) {
            const goal = await FinancialGoal.findOne({ _id: id, userId });
            if (!goal) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            const newAmount = goal.currentAmount + parseFloat(updates.addAmount);
            updates.currentAmount = newAmount;

            // Check for milestones
            const progress = (newAmount / goal.targetAmount) * 100;
            const milestones = [25, 50, 75, 100];

            for (const milestone of milestones) {
                const alreadyAchieved = goal.milestones.some(m => m.percentage === milestone);
                if (progress >= milestone && !alreadyAchieved) {
                    if (!updates.milestones) updates.milestones = goal.milestones;
                    updates.milestones.push({
                        percentage: milestone,
                        achievedAt: new Date(),
                        amount: newAmount
                    });
                }
            }

            // Mark as completed if target reached
            if (newAmount >= goal.targetAmount) {
                updates.status = 'completed';
            }

            delete updates.addAmount;
        }

        const goal = await FinancialGoal.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const goal = await FinancialGoal.findOneAndDelete({ _id: id, userId });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
};

// Get goal insights
export const getGoalInsights = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const goal = await FinancialGoal.findOne({ _id: id, userId });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const now = new Date();
        const deadline = new Date(goal.deadline);
        const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        const monthsRemaining = Math.ceil(daysRemaining / 30);
        const amountRemaining = goal.targetAmount - goal.currentAmount;

        const insights = {
            daysRemaining,
            monthsRemaining,
            amountRemaining: amountRemaining.toFixed(2),
            progressPercentage: ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1),
            onTrack: true,
            recommendations: []
        };

        // Calculate required monthly contribution
        if (monthsRemaining > 0 && amountRemaining > 0) {
            const requiredMonthly = amountRemaining / monthsRemaining;
            insights.requiredMonthlyContribution = requiredMonthly.toFixed(2);

            // Check if current contribution is sufficient
            if (goal.monthlyContribution > 0 && goal.monthlyContribution < requiredMonthly) {
                insights.onTrack = false;
                insights.recommendations.push({
                    type: 'increase_contribution',
                    message: `Increase monthly contribution to $${requiredMonthly.toFixed(2)} to reach your goal on time`,
                    priority: 'high'
                });
            } else if (goal.monthlyContribution === 0) {
                insights.recommendations.push({
                    type: 'set_contribution',
                    message: `Set up automatic contributions of $${requiredMonthly.toFixed(2)}/month`,
                    priority: 'high'
                });
            }
        }

        // Achievement velocity
        const daysSinceStart = Math.ceil((now - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceStart > 0) {
            const dailyRate = goal.currentAmount / daysSinceStart;
            const projectedCompletion = new Date(now.getTime() + (amountRemaining / dailyRate) * 24 * 60 * 60 * 1000);

            if (projectedCompletion > deadline) {
                insights.onTrack = false;
                insights.projectedCompletionDate = projectedCompletion.toISOString().split('T')[0];
                insights.recommendations.push({
                    type: 'accelerate',
                    message: 'At current pace, you\'ll miss your deadline. Consider increasing contributions.',
                    priority: 'high'
                });
            }
        }

        // Celebration messages
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        if (progress >= 100) {
            insights.recommendations.push({
                type: 'celebrate',
                message: '🎉 Congratulations! You\'ve achieved your goal!',
                priority: 'low'
            });
        } else if (progress >= 75) {
            insights.recommendations.push({
                type: 'motivate',
                message: '💪 You\'re almost there! Just a little more to go!',
                priority: 'low'
            });
        }

        res.json(insights);
    } catch (error) {
        console.error('Goal insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
};
