import mongoose from 'mongoose';

const IncomeSchema = mongoose.Schema({
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
    // Premium Features
    source: {
        type: String,
        trim: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'],
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
    expectedNextDate: {
        type: Date
    }
}, {
    timestamps: true
});

export const Income = mongoose.model("Income", IncomeSchema);