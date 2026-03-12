import { z } from 'zod';

export const expenseSchema = z.object({
    amount: z.number().positive(),
    category: z.string().min(1),
    date: z.coerce.date(),
    description: z.string().optional(),
});
