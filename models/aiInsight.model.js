import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    insightType: {
        type: String,
        enum: [
            'spending_pattern',
            'budget_warning',
            'savings_opportunity',
            'unusual_activity',
            'prediction',
            'goal_suggestion',
            'subscription_alert',
            'bill_reminder',
            'category_trend',
            'income_analysis'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    actionable: {
        type: Boolean,
        default: false
    },
    recommendations: [{
        action: String,
        estimatedImpact: String,
        priority: String
    }],
    relatedData: {
        category: String,
        amount: Number,
        percentage: Number,
        trend: String,
        comparison: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDismissed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date
    },
    aiModel: {
        type: String,
        default: 'gemini-pro'
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Index for efficient querying
aiInsightSchema.index({ userId: 1, createdAt: -1 });
aiInsightSchema.index({ userId: 1, isRead: 1 });

export const AIInsight = mongoose.model("AIInsight", aiInsightSchema);
