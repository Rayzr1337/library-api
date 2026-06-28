import 'express-session'
import { Types } from 'mongoose'

declare module 'express-session' {
    interface SessionData {
        userId?: string,
        isAdmin?: boolean
    }
}
