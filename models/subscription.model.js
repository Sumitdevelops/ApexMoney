import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
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
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    billingCycle: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        default: 'monthly',
        required: true
    },
    nextBillingDate: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['streaming', 'software', 'gaming', 'fitness', 'education', 'news', 'cloud_storage', 'music', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'cancelled'],
        default: 'active'
    },
    autoDetected: {
        type: Boolean,
        default: false
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100
    },
    reminderDays: {
        type: Number,
        default: 3
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Virtual for annual cost
subscriptionSchema.virtual('annualCost').get(function () {
    const multipliers = {
        daily: 365,
        weekly: 52,
        monthly: 12,
        quarterly: 4,
        yearly: 1
    };
    return this.amount * (multipliers[this.billingCycle] || 12);
});

subscriptionSchema.index({ userId: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
