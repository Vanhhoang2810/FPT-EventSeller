import { request, app, loginAs, ADMIN, DEMO } from './helpers';
import { sequelize } from '../config/database';
import '../models/index';

let adminToken: string;
let demoToken: string;

beforeAll(async () => {
  await sequelize.authenticate();
  adminToken = await loginAs(ADMIN.email, ADMIN.password);
  demoToken  = await loginAs(DEMO.email,  DEMO.password);
}, 20000);

afterAll(async () => {
  await sequelize.close();
});

describe('Tickets API', () => {
  it('lấy danh sách vé của user', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${demoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('vé có QR code là JWT hợp lệ', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${demoToken}`);

    if (res.body.data.length === 0) {
      console.warn('Không có vé để kiểm tra QR, bỏ qua');
      return;
    }
    const ticket = res.body.data[0];
    // JWT gồm 3 phần cách nhau bởi dấu chấm
    expect(ticket.qr_code.split('.').length).toBe(3);
    expect(ticket.qr_code).toMatch(/^eyJ/);
  });

  it('lấy chi tiết vé theo id', async () => {
    const listRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${demoToken}`);
    if (listRes.body.data.length === 0) return;

    const ticketId = listRes.body.data[0].id;
    const res = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${demoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(ticketId);
    expect(res.body.data.event).toBeDefined();
    expect(res.body.data.seat).toBeDefined();
  });

  it('trả về 401 khi truy cập vé không có token', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  it('user không truy cập được vé của người khác', async () => {
    // Lấy vé của demo user
    const listRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${demoToken}`);
    if (listRes.body.data.length === 0) return;

    const ticketId = listRes.body.data[0].id;

    // Admin đăng nhập là user khác — thử lấy vé của demo
    const res = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Trả 403 hoặc 404 — ticket không thuộc về admin
    expect([403, 404]).toContain(res.status);
  });
});

describe('QR Verify (Admin check-in)', () => {
  it('admin verify QR hợp lệ thành công', async () => {
    // Lấy vé active của demo user
    const listRes = await request(app)
      .get('/api/tickets?status=active')
      .set('Authorization', `Bearer ${demoToken}`);

    const activeTickets = (listRes.body.data ?? []).filter(
      (t: { status: string }) => t.status === 'active'
    );
    if (activeTickets.length === 0) {
      console.warn('Không có vé active để verify, bỏ qua');
      return;
    }

    const qrCode = activeTickets[0].qr_code;
    const res = await request(app)
      .post('/api/tickets/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qrCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('used');
    expect(res.body.data.used_at).toBeDefined();
  });

  it('customer không thể verify QR (chỉ admin)', async () => {
    const listRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${demoToken}`);
    if (listRes.body.data.length === 0) return;

    const qrCode = listRes.body.data[0].qr_code;
    const res = await request(app)
      .post('/api/tickets/verify')
      .set('Authorization', `Bearer ${demoToken}`)
      .send({ qrCode });

    expect(res.status).toBe(403);
  });

  it('trả về lỗi khi QR giả mạo', async () => {
    const res = await request(app)
      .post('/api/tickets/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qrCode: 'fake.qr.code' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Admin API — Demographics', () => {
  it('trả về dữ liệu giới tính và nhóm tuổi thực từ bảng users', async () => {
    const res = await request(app)
      .get('/api/admin/charts/demographics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.gender).toBeDefined();
    expect(res.body.data.ageGroups).toBeDefined();
    expect(Array.isArray(res.body.data.gender)).toBe(true);
    expect(Array.isArray(res.body.data.ageGroups)).toBe(true);
    // Mỗi item có name + value
    if (res.body.data.gender.length > 0) {
      expect(res.body.data.gender[0]).toHaveProperty('name');
      expect(res.body.data.gender[0]).toHaveProperty('value');
    }
  });

  it('customer không truy cập được demographics', async () => {
    const res = await request(app)
      .get('/api/admin/charts/demographics')
      .set('Authorization', `Bearer ${demoToken}`);
    expect(res.status).toBe(403);
  });
});
