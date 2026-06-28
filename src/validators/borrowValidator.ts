import { z } from 'zod' 

export const borrowSchema = z.object({ bookId: z.string().min(1) });


