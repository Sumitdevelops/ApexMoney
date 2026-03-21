import { z } from 'zod';

export const incomeSchema = z.object({
    amount: z.number().positive(),
    category: z.string().min(1),
    date: z.string().min(1),
}).passthrough();
