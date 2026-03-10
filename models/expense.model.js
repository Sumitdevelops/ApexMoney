import mongoose from 'mongoose';

const expenseSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    notes: {
        type: String,
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF']
    },
    // Premium Features
    merchant: {
        type: String,
        trim: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    tags: [{
        type: String,
        trim: true
    }],
    // AI Features
    aiCategorized: {
        type: Boolean,
        default: false
    },
    aiSuggestedCategory: {
        type: String
    },
    aiConfidence: {
        type: Number,
        min: 0,
        max: 100
    },
    isAnomaly: {
        type: Boolean,
        default: false
    },
    anomalyReason: {
        type: String
    }
}, {
    timestamps: true
});

expenseSchema.index({ userId: 1, date: -1 });

export const Expense = mongoose.model("Expense", expenseSchema);