import { z } from 'zod'

const categories = [
    'fantasy',
    'dystopia',
    'classic',
    'science',
    'history',
    'self-help',
    'psychology',
    'technology',
    'biography',
    'philosophy'
] as const;

export const bookSchema = z.object({
    name: z.string().min(1),
    author: z.string().min(1),
    category: z.enum(categories),
    description: z.string().min(1),
}); 


export type bookBody = z.infer<typeof bookSchema> & { cover: string };
export type bookUpdate = z.infer<typeof bookSchema> & { cover?: string };


