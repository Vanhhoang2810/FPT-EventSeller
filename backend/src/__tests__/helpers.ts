import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../app';
import '../models/index'; // đăng ký associations

export { request, app };

/** Đăng nhập và trả về accessToken */
export async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password, rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });
  if (!res.body.data?.accessToken) {
    throw new Error(`Đăng nhập thất bại: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
}

export const ADMIN = { email: 'admin@ticketrush.vn', password: 'Admin@12345' };
export const DEMO = { email: 'user@ticketrush.vn', password: 'User@12345' };
