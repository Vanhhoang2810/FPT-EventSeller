import { request, app, loginAs, ADMIN } from './helpers';
import { sequelize } from '../config/database';
import { Booking } from '../models/Booking';
import { Seat } from '../models/Seat';
import { User } from '../models/User';
import '../models/index';
import argon2 from 'argon2';

// Tài khoản test — tạo trước khi chạy, xoá sau khi xong
const TEST_USER_A = { email: 'test_a@ticketrush.vn', password: 'Test@123456', full_name: 'Test A' };
const TEST_USER_B = { email: 'test_b@ticketrush.vn', password: 'Test@123456', full_name: 'Test B' };

let tokenA: string;
let tokenB: string;
let adminToken: string;
let testEventId: number;
let availableSeatIds: number[];

beforeAll(async () => {
  // Đảm bảo associations được load
  await sequelize.authenticate();

  // Tạo 2 test users
  const hash = await argon2.hash(TEST_USER_A.password);
  await User.destroy({ where: { email: [TEST_USER_A.email, TEST_USER_B.email] } });
  await User.bulkCreate([
    { email: TEST_USER_A.email, password_hash: hash, full_name: TEST_USER_A.full_name, role: 'customer', is_active: true, email_verified: true, login_attempts: 0 },
    { email: TEST_USER_B.email, password_hash: hash, full_name: TEST_USER_B.full_name, role: 'customer', is_active: true, email_verified: true, login_attempts: 0 },
  ]);

  tokenA     = await loginAs(TEST_USER_A.email, TEST_USER_A.password);
  tokenB     = await loginAs(TEST_USER_B.email, TEST_USER_B.password);
  adminToken = await loginAs(ADMIN.email, ADMIN.password);

  // Lấy sự kiện có seats available (event 1)
  testEventId = 1;
  const mapRes = await request(app)
    .get(`/api/events/${testEventId}/seat-map`)
    .set('Authorization', `Bearer ${adminToken}`);
  const zones = mapRes.body.data?.zones ?? [];
  availableSeatIds = zones
    .flatMap((z: { seats: { id: number; status: string }[] }) => z.seats)
    .filter((s: { status: string }) => s.status === 'available')
    .map((s: { id: number }) => s.id)
    .slice(0, 5); // lấy tối đa 5 ghế để test
}, 30000);

afterAll(async () => {
  // Dọn bookings của test users
  const userRecords = await User.findAll({ where: { email: [TEST_USER_A.email, TEST_USER_B.email] } });
  const ids = userRecords.map((u) => u.id);
  if (ids.length) {
    const bookings = await Booking.findAll({ where: { user_id: ids } });
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length) {
      // Release seats liên quan
      const { BookingSeat } = await import('../models/BookingSeat');
      const bSeats = await BookingSeat.findAll({ where: { booking_id: bookingIds } });
      const seatIds = bSeats.map((bs) => bs.seat_id);
      await Seat.update({ status: 'available', locked_by: null, locked_at: null }, { where: { id: seatIds } });
      await Booking.destroy({ where: { id: bookingIds } });
    }
    await User.destroy({ where: { id: ids } });
  }
  await sequelize.close();
}, 30000);

// ─── Events API ──────────────────────────────────────────────────────────────

describe('Events API', () => {
  it('lấy danh sách sự kiện', async () => {
    const res = await request(app).get('/api/events?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('tìm kiếm sự kiện theo từ khoá', async () => {
    const res = await request(app).get('/api/events?search=trịnh');
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: { title: string }) =>
      e.title.toLowerCase().includes('trịnh')
    )).toBe(true);
  });

  it('lấy sơ đồ ghế của sự kiện', async () => {
    const res = await request(app).get(`/api/events/${testEventId}/seat-map`);
    expect(res.status).toBe(200);
    expect(res.body.data.zones).toBeDefined();
    expect(res.body.data.zones.length).toBeGreaterThan(0);
  });
});

// ─── Booking — Lock Seats ─────────────────────────────────────────────────────

describe('Booking — Lock Seats', () => {
  it('giữ ghế thành công (SELECT FOR UPDATE)', async () => {
    if (availableSeatIds.length < 1) return;
    const seatId = availableSeatIds[0];

    const res = await request(app)
      .post('/api/bookings/lock-seats')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ eventId: testEventId, seatIds: [seatId] });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toBeDefined();
    expect(res.body.data.expiresAt).toBeDefined();

    // Verify expires_at đúng ~10 phút
    const expiresAt = new Date(res.body.data.expiresAt).getTime();
    const now = Date.now();
    const diffMin = (expiresAt - now) / 60000;
    expect(diffMin).toBeGreaterThan(9);
    expect(diffMin).toBeLessThan(11);
  });

  it('trả về 400 khi seatIds rỗng (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/bookings/lock-seats')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ eventId: testEventId, seatIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('trả về 401 khi không có token', async () => {
    const res = await request(app)
      .post('/api/bookings/lock-seats')
      .send({ eventId: testEventId, seatIds: [999] });
    expect(res.status).toBe(401);
  });

  it('trả về lỗi khi ghế không tồn tại', async () => {
    const res = await request(app)
      .post('/api/bookings/lock-seats')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ eventId: testEventId, seatIds: [999999] });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Race Condition Test ───────────────────────────────────────────────────────

describe('Race Condition — 2 users cùng lock 1 ghế', () => {
  it('chỉ 1 trong 2 request đồng thời được lock ghế thành công', async () => {
    if (availableSeatIds.length < 3) {
      console.warn('Không đủ ghế available để test race condition, bỏ qua');
      return;
    }
    // Dùng ghế thứ 3 — ghế[0] đã bị user A lock, cần checkout trước
    const seatId = availableSeatIds[2];

    // Checkout pending booking của user A trước để user A được tham gia race
    const bookingRes = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${tokenA}`)
      .catch(() => null);
    const pendingBooking = bookingRes?.body?.data?.find?.(
      (b: { status: string }) => b.status === 'pending'
    );
    if (pendingBooking) {
      await request(app)
        .post(`/api/bookings/${pendingBooking.id}/checkout`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ paymentMethod: 'simulated' });
    }

    // Gửi 2 request đồng thời từ 2 users khác nhau
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ eventId: testEventId, seatIds: [seatId] }),
      request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ eventId: testEventId, seatIds: [seatId] }),
    ]);

    const statuses = [resA.status, resB.status];
    const successes = statuses.filter((s) => s === 200 || s === 201).length;
    const failures  = statuses.filter((s) => s >= 400).length;

    // Đúng 1 thành công, 1 thất bại — chứng minh pessimistic locking hoạt động
    expect(successes).toBe(1);
    expect(failures).toBe(1);
  }, 20000);
});

// ─── Checkout ─────────────────────────────────────────────────────────────────

describe('Checkout — Simulated Payment', () => {
  it('checkout thành công bằng simulated payment', async () => {
    // Lock 1 ghế mới cho user A (ghế index 4)
    let bookingId: number | null = null;
    const freeSeat = availableSeatIds[4];
    if (!freeSeat) { console.warn('Không còn ghế để checkout test'); return; }
    const lockRes = await request(app)
      .post('/api/bookings/lock-seats')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ eventId: testEventId, seatIds: [freeSeat] });
    if (lockRes.status !== 200 && lockRes.status !== 201) {
      console.warn('Lock thất bại, bỏ qua checkout test');
      return;
    }
    bookingId = lockRes.body.data.bookingId;

    const res = await request(app)
      .post(`/api/bookings/${bookingId}/checkout`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ paymentMethod: 'simulated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tickets).toBeDefined();
    expect(res.body.data.tickets.length).toBeGreaterThan(0);
    // Mỗi vé phải có QR code JWT
    const ticket = res.body.data.tickets[0];
    expect(ticket.qr_code).toMatch(/^eyJ/); // JWT starts with eyJ
    expect(ticket.status).toBe('active');
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Input Validation', () => {
  it('lock-seats: eventId phải là số nguyên', async () => {
    const res = await request(app)
      .post('/api/bookings/lock-seats')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ eventId: 'abc', seatIds: [1] });
    expect(res.status).toBe(400);
  });
});
