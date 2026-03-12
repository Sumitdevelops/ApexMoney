import { z } from 'zod';

export const subscriptionSchema = z.object({
    name: z.string().min(1),
    amount: z.number().positive(),
    billingCycle: z.string().min(1),
    nextBillingDate: z.coerce.date(),
});
