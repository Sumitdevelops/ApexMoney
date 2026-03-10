import mongoose from 'mongoose';

const financialGoalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    goalName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['savings', 'debt_payoff', 'investment', 'emergency_fund', 'vacation', 'purchase', 'education', 'other'],
        default: 'savings'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'cancelled'],
        default: 'active'
    },
    autoContribute: {
        type: Boolean,
        default: false
    },
    monthlyContribution: {
        type: Number,
        default: 0
    },
    // AI Features
    aiRecommendedAmount: {
        type: Number
    },
    aiSuggestions: [{
        suggestion: String,
        createdAt: { type: Date, default: Date.now }
    }],
    milestones: [{
        percentage: Number,
        achievedAt: Date,
        amount: Number
    }]
}, {
    timestamps: true
});

// Calculate progress percentage
financialGoalSchema.virtual('progressPercentage').get(function () {
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

financialGoalSchema.index({ userId: 1 });

export const FinancialGoal = mongoose.model("FinancialGoal", financialGoalSchema);
