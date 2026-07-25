declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      telegramId: string
      plan: 'free' | 'premium'
      isAdmin: boolean
    }
  }
}
export {}
