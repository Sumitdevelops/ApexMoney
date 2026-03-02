import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    // Premium Features
    subscriptionTier: {
        type: String,
        enum: ['free', 'pro', 'ai_pro', 'business'],
        default: 'free'
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'trial', 'expired', 'cancelled'],
        default: 'active'
    },
    trialEndsAt: {
        type: Date
    },
    // User Preferences
    preferences: {
        currency: {
            type: String,
            default: 'INR'
        },
        language: {
            type: String,
            default: 'en'
        },
        dateFormat: {
            type: String,
            default: 'MM/DD/YYYY'
        },
        notifications: {
            email: { type: Boolean, default: true },
            billReminders: { type: Boolean, default: true },
            budgetAlerts: { type: Boolean, default: true },
            aiInsights: { type: Boolean, default: true }
        }
    },
    // AI Preferences
    aiPreferences: {
        enableSmartInsights: {
            type: Boolean,
            default: false
        },
        autoCategorization: {
            type: Boolean,
            default: false
        },
        monthlyAnalysis: {
            type: Boolean,
            default: false
        },
        predictiveAlerts: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

export const User = mongoose.model("User", userSchema);