import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    isAdmin: z.boolean()
});

export const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(8)
});

export const userSchema = z.object({
    username: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    isAdmin: z.boolean()
});



export type userBody = z.infer<typeof userSchema>;
export type loginBody = z.infer<typeof loginSchema>;
export type registerBody = z.infer<typeof registerSchema>;
