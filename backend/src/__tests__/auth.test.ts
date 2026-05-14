import { request, app, ADMIN, DEMO } from './helpers';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('đăng nhập thành công với thông tin hợp lệ', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ ...ADMIN, rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(ADMIN.email);
      expect(res.body.data.user.role).toBe('admin');
    });

    it('đăng nhập thành công với tài khoản customer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ ...DEMO, rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('customer');
    });

    it('trả về 401 khi sai mật khẩu', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN.email, password: 'wrong', rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('trả về 401 khi email không tồn tại', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notexist@test.com', password: 'pass', rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });

      expect(res.status).toBe(401);
    });

    it('trả về lỗi validation khi thiếu email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'pass', turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/users/profile', () => {
    it('trả về thông tin user khi có token hợp lệ', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ ...DEMO, rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(DEMO.email);
    });

    it('trả về 401 khi không có token', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
    });

    it('trả về 401 khi token sai', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC — admin routes', () => {
    it('customer không thể truy cập admin dashboard', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ ...DEMO, rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('admin truy cập được admin dashboard', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ ...ADMIN, rememberMe: false, turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalRevenue).toBeDefined();
    });
  });
});
