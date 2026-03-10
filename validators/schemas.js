import { z } from 'zod';

const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z.string().email('Invalid email address');

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: emailSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
}).refine(data => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from old password',
    path: ['newPassword'],
});

export const expenseSchema = z.object({
    amount: z.number({ coerce: true }).positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required').max(50),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().max(500).optional(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF']).default('INR'),
    tags: z.array(z.string().max(30)).max(10).optional(),
    merchant: z.string().max(100).optional(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

export const incomeSchema = z.object({
    amount: z.number({ coerce: true }).positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required').max(50),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().max(500).optional(),
    currency: z.string().default('INR'),
    tags: z.array(z.string().max(30)).max(10).optional(),
    source: z.string().max(100).optional(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).optional(),
});

export const goalSchema = z.object({
    goalName: z.string().min(1, 'Goal name is required').max(100),
    description: z.string().max(500).optional(),
    targetAmount: z.number({ coerce: true }).positive('Target amount must be positive'),
    currentAmount: z.number({ coerce: true }).min(0).default(0),
    deadline: z.string().min(1, 'Deadline is required'),
    category: z.enum(['savings', 'debt_payoff', 'investment', 'emergency_fund', 'vacation', 'purchase', 'education', 'other']).default('savings'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    autoContribute: z.boolean().default(false),
    monthlyContribution: z.number({ coerce: true }).min(0).optional(),
});

export const subscriptionSchema = z.object({
    name: z.string().min(1, 'Subscription name is required').max(100),
    description: z.string().max(500).optional(),
    amount: z.number({ coerce: true }).positive('Amount must be positive'),
    currency: z.string().default('INR'),
    billingCycle: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    nextBillingDate: z.string().min(1, 'Next billing date is required'),
    startDate: z.string().optional(),
    category: z.enum(['streaming', 'software', 'gaming', 'fitness', 'education', 'news', 'cloud_storage', 'music', 'other']).default('other'),
    status: z.enum(['active', 'paused', 'cancelled']).default('active'),
    reminderDays: z.number({ coerce: true }).min(0).max(30).default(7),
    paymentMethod: z.string().max(100).optional(),
    website: z.string().url('Invalid URL format').optional().or(z.literal('')),
    notes: z.string().max(500).optional(),
});
