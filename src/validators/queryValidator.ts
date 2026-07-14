import { z } from 'zod'
import { categories } from './bookValidator';

export const bookQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    category: z.enum(categories).optional(),
    author: z.string().optional(),
    available: z.enum(['true', 'false']).transform(e => e === 'true').optional(),
    sort: z.enum(['name', 'author', 'category', 'createdAt', 'id']).optional(),
    order: z.enum(['asc', 'desc']).default('asc')
});

export const borrowQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    returned: z.enum(['true', 'false']).transform(e => e === 'true').optional(),
    sort: z.enum(['borrowDate', 'returnDate']).optional(),
    order: z.enum(['asc', 'desc']).default('asc')
});


export type BookQuery = z.infer<typeof bookQuerySchema>;
export type BorrowQuery = z.infer<typeof borrowQuerySchema>;
