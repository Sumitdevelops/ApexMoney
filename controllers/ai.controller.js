import Groq from 'groq-sdk';
import { AIInsight } from '../models/aiInsight.model.js';
import { Expense } from '../models/expense.model.js';
import { Income } from '../models/income.model.js';
import { User } from '../models/user.model.js';

// Lazy-initialize Groq client
let _groq = null;
const getGroq = () => {
    if (_groq === null && process.env.GROQ_API_KEY) {
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _groq;
};

// Helper: call Groq and get text response
const askAI = async (prompt, systemPrompt = null) => {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
        temperature: 0.7
    });
    return response.choices[0].message.content.trim();
};

// AI-powered expense categorization
export const categorizeExpense = async (req, res) => {
    try {
        const { description, amount } = req.body;
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Rule-based categorization (fallback)
        const categoryRules = {
            'food': ['restaurant', 'cafe', 'food', 'grocery', 'market', 'pizza', 'burger', 'coffee', 'dining', 'swiggy', 'zomato'],
            'transport': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train', 'ola', 'rapido'],
            'shopping': ['amazon', 'store', 'shop', 'mall', 'clothing', 'shoes', 'purchase', 'flipkart', 'myntra'],
            'entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'ticket', 'hotstar'],
            'utilities': ['electricity', 'water', 'gas', 'internet', 'phone', 'cable', 'wifi', 'broadband'],
            'healthcare': ['hospital', 'doctor', 'pharmacy', 'medical', 'clinic', 'medicine'],
            'education': ['school', 'course', 'book', 'tuition', 'class', 'university', 'udemy'],
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

        if (getGroq()) {
            try {
                const aiCategory = await askAI(
                    `Categorize this expense: "${description}" amount ₹${amount}. Choose from: food, transport, shopping, entertainment, utilities, healthcare, education, housing, personal, other. Respond with ONLY the category name, nothing else.`
                );
                const cleaned = aiCategory.toLowerCase().trim().replace(/[^a-z]/g, '');
                const validCats = [...Object.keys(categoryRules), 'personal', 'other'];
                if (validCats.includes(cleaned)) {
                    suggestedCategory = cleaned;
                    confidence = 95;
                }
            } catch (aiError) {
                console.error('AI categorization failed:', aiError.message);
            }
        }

        res.json({ category: suggestedCategory, confidence, aiPowered: getGroq() !== null });
    } catch (error) {
        console.error('Categorization error:', error);
        res.status(500).json({ error: 'Failed to categorize expense' });
    }
};

// Generate financial insights
export const generateInsights = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(100);
        const incomes = await Income.find({ userId }).sort({ date: -1 }).limit(50);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;

        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const incomeSources = {};
        incomes.forEach(inc => {
            const source = inc.source || inc.category || 'Unknown';
            incomeSources[source] = (incomeSources[source] || 0) + inc.amount;
        });

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
        const previousExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= sixtyDaysAgo && d < thirtyDaysAgo;
        });
        const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
        const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
        const spendingChange = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal * 100).toFixed(1) : null;

        let insights = [];

        if (getGroq() && (expenses.length > 0 || incomes.length > 0)) {
            try {
                const prompt = `Analyze this user's financial data and give personalized, actionable insights.

FINANCIAL DATA:
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expenses: ₹${totalExpenses.toLocaleString()}
- Net Savings: ₹${(totalIncome - totalExpenses).toLocaleString()}
- Savings Rate: ${savingsRate}%
- Expense Categories: ${JSON.stringify(categoryTotals)}
- Income Sources: ${JSON.stringify(incomeSources)}
- Recent 30-day spending: ₹${recentTotal.toLocaleString()}
- Previous 30-day spending: ₹${previousTotal.toLocaleString()}
- Spending change: ${spendingChange !== null ? spendingChange + '%' : 'N/A'}
- Transactions: ${expenses.length} expenses, ${incomes.length} incomes

RESPOND WITH ONLY valid JSON array (no markdown, no code blocks):
[{"insightType":"spending_pattern|budget_warning|savings_opportunity|unusual_activity|prediction|goal_suggestion","title":"Short title","content":"2-3 sentences with specific ₹ amounts","priority":"critical|high|medium|low","recommendations":[{"action":"Specific step","estimatedImpact":"Expected result","priority":"high|medium|low"}]}]

Generate 3-5 insights. Use ₹ currency. Be specific with real numbers.`;

                const responseText = await askAI(prompt, 'You are a smart financial advisor for the ApexMoney app. Always respond with valid JSON only.');

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
                console.error('AI insight generation failed:', aiError.message);
            }
        }

        // Fallback rule-based insights
        if (insights.length === 0) {
            if (savingsRate < 10 && totalIncome > 0) {
                insights.push({
                    insightType: 'savings_opportunity', title: 'Low Savings Rate Detected',
                    content: `Your savings rate is ${savingsRate}%. Experts recommend 20%+. You're spending ₹${totalExpenses.toLocaleString()} out of ₹${totalIncome.toLocaleString()}.`,
                    priority: 'high', actionable: true,
                    recommendations: [
                        { action: 'Review and cut unnecessary subscriptions', estimatedImpact: 'Save ₹500-2000/month', priority: 'high' },
                        { action: 'Set up automatic savings', estimatedImpact: 'Increase savings by 10%', priority: 'medium' }
                    ]
                });
            } else if (savingsRate >= 20) {
                insights.push({
                    insightType: 'savings_opportunity', title: 'Great Savings Rate! 🎉',
                    content: `You're saving ${savingsRate}% of your income. Excellent discipline!`,
                    priority: 'low', actionable: false
                });
            }

            const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
            if (topCat && totalExpenses > 0) {
                const pct = ((topCat[1] / totalExpenses) * 100).toFixed(1);
                if (pct > 40) {
                    insights.push({
                        insightType: 'spending_pattern', title: `High ${topCat[0]} Spending`,
                        content: `${topCat[0]} = ${pct}% of expenses (₹${topCat[1].toLocaleString()}).`,
                        priority: 'medium', actionable: true,
                        recommendations: [{ action: `Reduce ${topCat[0]} costs`, estimatedImpact: 'Save 15-20%', priority: 'medium' }]
                    });
                }
            }

            if (spendingChange !== null && Math.abs(spendingChange) > 15) {
                insights.push({
                    insightType: 'spending_pattern',
                    title: spendingChange > 0 ? '📈 Spending Increased' : '📉 Spending Decreased',
                    content: `Spending ${spendingChange > 0 ? 'up' : 'down'} ${Math.abs(spendingChange)}% vs last month.`,
                    priority: spendingChange > 20 ? 'high' : 'medium', actionable: spendingChange > 0,
                    recommendations: spendingChange > 0 ? [{ action: 'Review recent large expenses', estimatedImpact: 'Identify unusual spending', priority: 'high' }] : []
                });
            }
        }

        await AIInsight.deleteMany({ userId });
        for (const insight of insights) {
            await AIInsight.create({ userId, ...insight, confidence: getGroq() ? 90 : 75 });
        }

        const allInsights = await AIInsight.find({ userId }).sort({ createdAt: -1 }).limit(10);

        res.json({
            insights: allInsights,
            summary: {
                totalExpenses, totalIncome, savingsRate,
                insightCount: insights.length,
                aiPowered: getGroq() !== null
            }
        });
    } catch (error) {
        console.error('Generate insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
};

// Predict spending
export const predictSpending = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const expenses = await Expense.find({ userId, date: { $gte: threeMonthsAgo.toISOString().split('T')[0] } });

        if (expenses.length < 5) {
            return res.json({ prediction: null, message: 'Not enough data for predictions.' });
        }

        const categoryAverages = {};
        const monthlyTotals = {};

        expenses.forEach(exp => {
            const month = exp.date.substring(0, 7);
            categoryAverages[exp.category] = categoryAverages[exp.category] || [];
            categoryAverages[exp.category].push(exp.amount);
            monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
        });

        const predictions = {};
        let totalPrediction = 0;
        for (const [category, amounts] of Object.entries(categoryAverages)) {
            const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const trend = amounts.length >= 2 ? (amounts[amounts.length - 1] - amounts[0]) / amounts.length : 0;
            predictions[category] = Math.max(0, avg + trend);
            totalPrediction += predictions[category];
        }

        const monthlyAvg = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / Object.keys(monthlyTotals).length;

        res.json({
            prediction: {
                total: totalPrediction.toFixed(2),
                byCategory: Object.entries(predictions).map(([category, amount]) => ({
                    category, predicted: amount.toFixed(2), confidence: 75
                })),
                historicalAverage: monthlyAvg.toFixed(2),
                confidence: 75,
                basedOnMonths: Object.keys(monthlyTotals).length
            }
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to generate prediction' });
    }
};

// Budget recommendations
export const getBudgetRecommendations = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const incomes = await Income.find({ userId }).sort({ date: -1 }).limit(50);
        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const avgMonthlyIncome = totalIncome / Math.max(1, incomes.length / 3);

        res.json({
            recommendations: {
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
            }
        });
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
        await AIInsight.findOneAndUpdate({ _id: insightId, userId }, { isRead: true });
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
        await AIInsight.findOneAndUpdate({ _id: insightId, userId }, { isDismissed: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Dismiss insight error:', error);
        res.status(500).json({ error: 'Failed to dismiss insight' });
    }
};

// AI Chat
export const aiChat = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { message } = req.body;

        if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(100);
        const incomes = await Income.find({ userId }).sort({ date: -1 }).limit(50);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;

        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const recentExpenses = expenses.slice(0, 10).map(e => ({
            description: e.description, amount: e.amount, category: e.category, date: e.date
        }));

        if (!getGroq()) {
            return res.json({ reply: "AI is not configured. Please set up your GROQ_API_KEY.", aiPowered: false });
        }

        const systemPrompt = `You are "Apex AI", the smart financial assistant inside the ApexMoney budget tracking app.

USER'S FINANCIAL SNAPSHOT:
- Name: ${user.name || 'User'}
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expenses: ₹${totalExpenses.toLocaleString()}
- Net Balance: ₹${(totalIncome - totalExpenses).toLocaleString()}
- Savings Rate: ${savingsRate}%
- Spending by Category: ${JSON.stringify(categoryTotals)}
- Recent 10 Transactions: ${JSON.stringify(recentExpenses)}

RULES:
- Be conversational, friendly, and encouraging but honest
- Always reference REAL numbers from the data — never make up amounts
- Use ₹ for currency
- Give specific, actionable advice
- If unrelated to finance, gently redirect
- Use emojis sparingly
- Keep responses concise (2-4 sentences unless they ask for detail)
- If no data, encourage them to start tracking`;

        const reply = await askAI(message, systemPrompt);
        res.json({ reply, aiPowered: true });
    } catch (error) {
        console.error('AI Chat error:', error?.message || error);
        res.status(500).json({ error: 'Failed to get AI response', details: error?.message || 'Unknown error' });
    }
};

// Receipt Scanner - Parse receipt text using AI
export const scanReceipt = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { receiptText } = req.body;

        if (!receiptText || !receiptText.trim()) {
            return res.status(400).json({ error: 'Receipt text is required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'User not found' });

        if (!getGroq()) {
            return res.status(503).json({ error: 'AI is not configured' });
        }

        const result = await askAI(
            `You are an expert receipt parser. Carefully analyze this receipt text and extract expense details.

CRITICAL RULES:
1. AMOUNT: Find the FINAL TOTAL on the receipt (look for "Total", "Grand Total", "Amount Due", "Total Due"). This is the amount AFTER tax and any other charges. Do NOT sum individual items yourself — use the total printed on the receipt.
2. CURRENCY: Detect the currency from symbols on the receipt:
   - "$" = USD (US Dollar)
   - "₹" = INR (Indian Rupee)  
   - "€" = EUR (Euro)
   - "£" = GBP (British Pound)
   - If no symbol, check for country/location clues. Default to USD if unclear.
3. DATE: Look for date/time stamps on the receipt. Convert to YYYY-MM-DD format.
4. MERCHANT: The store/restaurant/business name, usually at the top of the receipt.

RECEIPT TEXT:
"""
${receiptText.substring(0, 2000)}
"""

Respond with ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "amount": <number, the FINAL TOTAL from the receipt, exactly as printed>,
  "currency": "<three-letter code: USD, INR, EUR, GBP, JPY, AUD, CAD, SGD, AED, CHF>",
  "currencySymbol": "<the symbol: $, ₹, €, £, ¥, etc.>",
  "category": "<one of: Food, Travel, Shopping, Bills, Health, Entertainment, Other>",
  "merchant": "<store/restaurant/business name>",
  "date": "<date in YYYY-MM-DD format, or null if not found>",
  "description": "<brief 5-word max description>",
  "items": ["<ONLY actual purchased products/food items, NOT store name, address, card numbers, tax, subtotal, or payment info>"],
  "confidence": <0-100 confidence score>
}`,
            'You are a precise receipt parser. Extract EXACTLY what is printed on the receipt. For the amount, always use the FINAL TOTAL line, never calculate it yourself. Detect the currency from the symbols used on the receipt. Respond with valid JSON only, no markdown.'
        );

        let parsed;
        try {
            let jsonText = result;
            if (jsonText.startsWith('```')) jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(jsonText);
        } catch {
            return res.status(422).json({ error: 'Could not parse receipt', raw: result });
        }

        res.json({
            ...parsed,
            aiPowered: true
        });
    } catch (error) {
        console.error('Receipt scan error:', error?.message || error);
        res.status(500).json({ error: 'Failed to scan receipt', details: error?.message || 'Unknown error' });
    }
};
