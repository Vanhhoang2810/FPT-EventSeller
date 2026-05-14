declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: 'customer' | 'admin';
      emailVerified: boolean;
    }
    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export {};
