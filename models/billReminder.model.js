import mongoose from 'mongoose';

const billReminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    billName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        min: 0
    },
    isFixedAmount: {
        type: Boolean,
        default: true
    },
    dueDate: {
        type: Number, // Day of month (1-31)
        required: true,
        min: 1,
        max: 31
    },
    category: {
        type: String,
        enum: ['rent', 'utilities', 'insurance', 'loan', 'credit_card', 'subscription', 'tax', 'other'],
        default: 'other'
    },
    recurring: {
        type: Boolean,
        default: true
    },
    frequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
        default: 'monthly'
    },
    notificationDays: {
        type: Number,
        default: 3, // Notify 3 days before
        min: 0,
        max: 30
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'cancelled'],
        default: 'pending'
    },
    paymentHistory: [{
        paidDate: Date,
        amount: Number,
        notes: String
    }],
    autoLink: {
        type: Boolean,
        default: false
    },
    linkedExpenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense"
    },
    notes: {
        type: String,
        trim: true
    },
    lastPaidDate: {
        type: Date
    },
    nextDueDate: {
        type: Date
    }
}, {
    timestamps: true
});

export const BillReminder = mongoose.model("BillReminder", billReminderSchema);
