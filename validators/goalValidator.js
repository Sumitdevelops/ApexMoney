import { z } from 'zod';

export const goalSchema = z.object({
    goalName: z.string().min(1),
    targetAmount: z.number().positive(),
    deadline: z.coerce.date(),
});
