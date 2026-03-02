import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIInsight } from '../models/aiInsight.model.js';
import { Expense } from '../models/expense.model.js';
import { Income } from '../models/income.model.js';
import { User } from '../models/user.model.js';

// Initialize Gemini AI (use environment variable for API key)
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// AI-powered expense categorization
export const categorizeExpense = async (req, res) => {
    try {
        const { description, amount } = req.body;
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Rule-based categorization (fallback if no API key)
        const categoryRules = {
            'food': ['restaurant', 'cafe', 'food', 'grocery', 'market', 'pizza', 'burger', 'coffee', 'dining'],
            'transport': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train'],
            'shopping': ['amazon', 'store', 'shop', 'mall', 'clothing', 'shoes', 'purchase'],
            'entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'ticket'],
            'utilities': ['electricity', 'water', 'gas', 'internet', 'phone', 'cable'],
            'healthcare': ['hospital', 'doctor', 'pharmacy', 'medical', 'clinic', 'medicine'],
            'education': ['school', 'course', 'book', 'tuition', 'class', 'university'],
            'housing': ['rent', 'mortgage', 'lease', 'maintenance', 'repair']
        };

        let suggestedCategory = 'other';
        let confidence = 50;

        const descLower = description.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryRules)) {
            if (keywords.some(keyword => descLower.includes(keyword))) {
                suggestedCategory = category;
                confidence = 85;
                break;
            }
        }

        // If Gemini AI is available, use it for better categorization
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const prompt = `Categorize this expense: "${description}" with amount $${amount}. 
                Choose from: food, transport, shopping, entertainment, utilities, healthcare, education, housing, personal, other.
                Respond with only the category name.`;

                const result = await model.generateContent(prompt);
                const aiCategory = result.response.text().trim().toLowerCase();

                if (Object.keys(categoryRules).includes(aiCategory) || aiCategory === 'other' || aiCategory === 'personal') {
                    suggestedCategory = aiCategory;
                    confidence = 95;
                }
            } catch (aiError) {
                console.error('AI categorization failed, using rule-based:', aiError);
            }
        }

        res.json({
            category: suggestedCategory,
            confidence,
            aiPowered: genAI !== null
        });

    } catch (error) {
        console.error('Categorization error:', error);
        res.status(500).json({ error: 'Failed to categorize expense' });
    }
};

// Generate financial insights using Gemini AI
export const generateInsights = async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Get user's financial data
        const expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(100);
        const incomes = await Income.find({ userId }).sort({ date: -1 }).limit(50);

        // Calculate metrics for the AI prompt
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;

        // Category breakdown
        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        // Income sources
        const incomeSources = {};
        incomes.forEach(inc => {
            const source = inc.source || inc.category || 'Unknown';
            incomeSources[source] = (incomeSources[source] || 0) + inc.amount;
        });

        // Recent spending trend (last 30 days vs previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
        const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
        const previousExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        });
        const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
        const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
        const spendingChange = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal * 100).toFixed(1) : null;

        let insights = [];

        // Try Gemini AI first
        if (genAI && (expenses.length > 0 || incomes.length > 0)) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const prompt = `You are a smart financial advisor AI for "ApexMoney" app. Analyze this user's financial data and give personalized, actionable insights.

USER FINANCIAL DATA:
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expenses: ₹${totalExpenses.toLocaleString()}
- Net Savings: ₹${(totalIncome - totalExpenses).toLocaleString()}
- Savings Rate: ${savingsRate}%
- Expense Categories: ${JSON.stringify(categoryTotals)}
- Income Sources: ${JSON.stringify(incomeSources)}
- Recent 30-day spending: ₹${recentTotal.toLocaleString()}
- Previous 30-day spending: ₹${previousTotal.toLocaleString()}
- Spending change: ${spendingChange !== null ? spendingChange + '%' : 'Not enough data'}
- Number of transactions: ${expenses.length} expenses, ${incomes.length} incomes

RESPOND WITH EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):
[
  {
    "insightType": "spending_pattern" or "budget_warning" or "savings_opportunity" or "unusual_activity" or "prediction" or "goal_suggestion",
    "title": "Short catchy title",
    "content": "Detailed personalized advice in 2-3 sentences using the actual numbers from the data. Be specific with amounts in ₹.",
    "priority": "critical" or "high" or "medium" or "low",
    "recommendations": [
      {"action": "Specific action step", "estimatedImpact": "Expected savings or improvement", "priority": "high" or "medium" or "low"}
    ]
  }
]

Generate 3-5 insights. Be specific with real numbers from the data. Use ₹ for currency. Focus on actionable advice the user can implement today. If savings rate is low, be direct about it. If a category dominates spending, suggest specific cuts.`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text().trim();

                // Parse JSON - handle potential markdown code blocks
                let jsonText = responseText;
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                }

                const aiInsights = JSON.parse(jsonText);

                if (Array.isArray(aiInsights) && aiInsights.length > 0) {
                    insights = aiInsights.map(insight => ({
                        insightType: insight.insightType || 'spending_pattern',
                        title: insight.title,
                        content: insight.content,
                        priority: insight.priority || 'medium',
                        actionable: true,
                        recommendations: insight.recommendations || [],
                        relatedData: insight.relatedData || {}
                    }));
                }
            } catch (aiError) {
                console.error('Gemini AI insight generation failed, falling back to rule-based:', aiError.message);
            }
        }

        // Fallback: rule-based insights if Gemini didn't work or no data
        if (insights.length === 0) {
            if (savingsRate < 10 && totalIncome > 0) {
                insights.push({
                    insightType: 'savings_opportunity',
                    title: 'Low Savings Rate Detected',
                    content: `Your current savings rate is ${savingsRate}%. Financial experts recommend saving at least 20% of your income. You're spending ₹${totalExpenses.toLocaleString()} out of ₹${totalIncome.toLocaleString()}.`,
                    priority: 'high',
                    actionable: true,
                    recommendations: [
                        { action: 'Review and reduce unnecessary subscriptions', estimatedImpact: 'Save ₹500-2000/month', priority: 'high' },
                        { action: 'Set up automatic savings transfers', estimatedImpact: 'Increase savings by 10%', priority: 'medium' }
                    ],
                    relatedData: { percentage: savingsRate, trend: 'needs_improvement' }
                });
            } else if (savingsRate >= 20) {
                insights.push({
                    insightType: 'savings_opportunity',
                    title: 'Great Savings Rate! 🎉',
                    content: `You're saving ${savingsRate}% of your income. That's excellent financial discipline!`,
                    priority: 'low',
                    actionable: false,
                    relatedData: { percentage: savingsRate, trend: 'excellent' }
                });
            }

            const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
            if (topCategory && totalExpenses > 0) {
                const categoryPercentage = ((topCategory[1] / totalExpenses) * 100).toFixed(1);
                if (categoryPercentage > 40) {
                    insights.push({
                        insightType: 'spending_pattern',
                        title: `High ${topCategory[0]} Spending`,
                        content: `${topCategory[0]} accounts for ${categoryPercentage}% of your expenses (₹${topCategory[1].toLocaleString()}). This is higher than recommended.`,
                        priority: 'medium',
                        actionable: true,
                        recommendations: [
                            { action: `Look for ways to reduce ${topCategory[0]} costs`, estimatedImpact: 'Save 15-20%', priority: 'medium' }
                        ],
                        relatedData: { category: topCategory[0], amount: topCategory[1], percentage: categoryPercentage }
                    });
                }
            }

            if (spendingChange !== null && Math.abs(spendingChange) > 15) {
                insights.push({
                    insightType: 'spending_pattern',
                    title: spendingChange > 0 ? '📈 Spending Increased' : '📉 Spending Decreased',
                    content: `Your spending has ${spendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendingChange)}% compared to last month.`,
                    priority: spendingChange > 20 ? 'high' : 'medium',
                    actionable: spendingChange > 0,
                    recommendations: spendingChange > 0 ? [
                        { action: 'Review recent large expenses', estimatedImpact: 'Identify unusual spending', priority: 'high' }
                    ] : [],
                    relatedData: { percentage: spendingChange, trend: spendingChange > 0 ? 'increasing' : 'decreasing' }
                });
            }
        }

        // Clear old insights before saving new ones
        await AIInsight.deleteMany({ userId });

        // Save insights to database
        for (const insight of insights) {
            await AIInsight.create({
                userId,
                ...insight,
                confidence: genAI ? 90 : 75
            });
        }

        // Return fresh insights
        const allInsights = await AIInsight.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            insights: allInsights,
            summary: {
                totalExpenses,
                totalIncome,
                savingsRate,
                insightCount: insights.length,
                aiPowered: genAI !== null
            }
        });

    } catch (error) {
        console.error('Generate insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
};

// Predict next month's spending
export const predictSpending = async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Get last 3 months of expenses
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const expenses = await Expense.find({
            userId,
            date: { $gte: threeMonthsAgo.toISOString().split('T')[0] }
        });

        if (expenses.length < 5) {
            return res.json({
                prediction: null,
                message: 'Not enough data for predictions. Add more expenses to get insights.'
            });
        }

        // Calculate average monthly spending by category
        const categoryAverages = {};
        const monthlyTotals = {};

        expenses.forEach(exp => {
            const month = exp.date.substring(0, 7); // YYYY-MM
            categoryAverages[exp.category] = categoryAverages[exp.category] || [];
            categoryAverages[exp.category].push(exp.amount);
            monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
        });

        // Predict by category
        const predictions = {};
        let totalPrediction = 0;

        for (const [category, amounts] of Object.entries(categoryAverages)) {
            const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const trend = amounts.length >= 2 ? (amounts[amounts.length - 1] - amounts[0]) / amounts.length : 0;
            predictions[category] = Math.max(0, avg + trend);
            totalPrediction += predictions[category];
        }

        // Overall monthly average
        const monthlyAverage = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / Object.keys(monthlyTotals).length;

        res.json({
            prediction: {
                total: totalPrediction.toFixed(2),
                byCategory: Object.entries(predictions).map(([category, amount]) => ({
                    category,
                    predicted: amount.toFixed(2),
                    confidence: 75
                })),
                historicalAverage: monthlyAverage.toFixed(2),
                confidence: 75,
                basedOnMonths: Object.keys(monthlyTotals).length
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to generate prediction' });
    }
};

// Get budget recommendations
export const getBudgetRecommendations = async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(100);
        const incomes = await Income.find({ userId }).sort({ date: -1 }).limit(50);

        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const avgMonthlyIncome = totalIncome / Math.max(1, incomes.length / 3);

        // 50/30/20 rule recommendations
        const recommendations = {
            rule: '50/30/20 Budget Rule',
            description: '50% needs, 30% wants, 20% savings',
            allocations: {
                needs: (avgMonthlyIncome * 0.5).toFixed(2),
                wants: (avgMonthlyIncome * 0.3).toFixed(2),
                savings: (avgMonthlyIncome * 0.2).toFixed(2)
            },
            categoryBudgets: {
                food: (avgMonthlyIncome * 0.15).toFixed(2),
                transport: (avgMonthlyIncome * 0.10).toFixed(2),
                housing: (avgMonthlyIncome * 0.30).toFixed(2),
                utilities: (avgMonthlyIncome * 0.05).toFixed(2),
                entertainment: (avgMonthlyIncome * 0.10).toFixed(2),
                shopping: (avgMonthlyIncome * 0.10).toFixed(2),
                healthcare: (avgMonthlyIncome * 0.05).toFixed(2),
                other: (avgMonthlyIncome * 0.15).toFixed(2)
            }
        };

        res.json({ recommendations });

    } catch (error) {
        console.error('Budget recommendations error:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
};

// Mark insight as read
export const markInsightRead = async (req, res) => {
    try {
        const { insightId } = req.params;
        const userId = req.session.userId;

        await AIInsight.findOneAndUpdate(
            { _id: insightId, userId },
            { isRead: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark insight as read' });
    }
};

// Dismiss insight
export const dismissInsight = async (req, res) => {
    try {
        const { insightId } = req.params;
        const userId = req.session.userId;

        await AIInsight.findOneAndUpdate(
            { _id: insightId, userId },
            { isDismissed: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Dismiss insight error:', error);
        res.status(500).json({ error: 'Failed to dismiss insight' });
    }
};
