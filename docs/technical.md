# Giải pháp kỹ thuật

> **TicketRush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | **Technical** | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../DESIGN.md)

---

## 5. Giải pháp kỹ thuật

### 5.1 ★ Database Concurrency — Chống tranh chấp ghế

**Giải pháp: Pessimistic Locking (SELECT FOR UPDATE)**

```typescript
async function lockSeats(userId: number, eventId: number, seatIds: number[]) {
  // Kiểm tra user chỉ có 1 booking pending per event
  const existingBooking = await Booking.findOne({
    where: { user_id: userId, event_id: eventId, status: 'pending' }
  });
  if (existingBooking) throw new ConflictError('Bạn đã có đơn đang chờ thanh toán');

  // Kiểm tra max_tickets_per_user
  const totalTickets = await Ticket.count({
    where: { user_id: userId, event_id: eventId, status: ['active'] }
  });
  const pendingSeats = await BookingSeat.count({
    include: [{ model: Booking, where: { user_id: userId, event_id: eventId, status: 'pending' } }]
  });
  const event = await Event.findByPk(eventId);
  if (totalTickets + pendingSeats + seatIds.length > event.max_tickets_per_user) {
    throw new ValidationError(`Tối đa ${event.max_tickets_per_user} vé/người cho sự kiện này`);
  }

  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });

  try {
    const seats = await Seat.findAll({
      where: { id: seatIds, status: 'available' },
      include: [{ model: Zone, attributes: ['id', 'name', 'price'] }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (seats.length !== seatIds.length) {
      throw new ConflictError('Một số ghế đã được người khác chọn');
    }

    await Seat.update(
      { status: 'locked', locked_by: userId, locked_at: new Date() },
      { where: { id: seatIds }, transaction }
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const booking = await Booking.create({
      user_id: userId, event_id: eventId, status: 'pending',
      total_amount: seats.reduce((sum, s) => sum + s.zone.price, 0),
      seat_count: seats.length, expires_at: expiresAt
    }, { transaction });

    await BookingSeat.bulkCreate(
      seats.map(s => ({ booking_id: booking.id, seat_id: s.id, price: s.zone.price })),
      { transaction }
    );

    await transaction.commit();
    io.to(`event:${eventId}`).emit('seat:bulk-updated', {
      seats: seatIds.map(id => ({ seatId: id, status: 'locked' }))
    });
    return booking;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### 5.2 ★ Ticket Lifecycle & Background Job

```
Available → [lock] → Locked → [checkout] → Sold
                       ↓
                [10 phút hết hạn]
                       ↓
                   Released (→ Available)
```

BullMQ repeating job mỗi 30 giây: quét bookings pending + expires_at < now → release seats + broadcast + gửi notification + email.

### 5.3 ★ Real-time Seat Map (WebSocket)

Socket.IO rooms: mỗi event = 1 room. Client join room khi vào seat selection page, leave khi rời. Server broadcast `seat:bulk-updated` sau mỗi transaction thành công.

**Reconnection strategy:** Socket.IO auto-reconnect. Sau reconnect → client re-fetch toàn bộ seat map state (GET `/events/:id/seat-map`) để sync, rồi tiếp tục listen WebSocket events.

### 5.4 ★ Virtual Queue

Redis Sorted Set (score = timestamp join). Cấp quyền theo batch (50 người/lượt). Token TTL 5 phút.

**Redis key patterns:**
- `queue:event:{eventId}` — sorted set, score = join timestamp
- `queue:active:{eventId}` — set of active user IDs
- `queue:token:{token}` — string, value = userId, TTL 300s (5 phút)

**Verify token khi lock-seats:** middleware `queue.middleware.ts` đọc header `X-Queue-Token` → `redis.get('queue:token:{token}')` → check userId match → cho phép. Nếu event không bật queue → skip middleware.

**Auto-trigger:** khi concurrent WebSocket connections cho 1 event > threshold (config `QUEUE_THRESHOLD`, mặc định 200) → auto enable queue. Admin cũng có thể bật/tắt thủ công qua `PUT /admin/events/:id/queue`.

**Edge cases:** User refresh trang → Redis persist vị trí → query lại, KHÔNG mất vị trí. Token hết hạn → user quay cuối hàng.

### 5.5 OAuth2 & Anti-Spam

**Google OAuth2:**
```
1. Client: click "Đăng nhập bằng Google" → Google popup → nhận id_token
2. Client: POST /api/auth/google { googleIdToken }
3. Server: verify id_token với Google → tìm/tạo user (google_id) → trả JWT
```

**Cloudflare Turnstile CAPTCHA:** Trên form register + login + forgot-password. Client render widget → nhận turnstile token → gửi kèm request → server verify qua Turnstile API.

**Account lockout:** 5 lần login sai liên tiếp → locked_until = now + 15 phút. Login thành công → reset login_attempts = 0.

**Email verification:** Register → gửi email chứa link `/verify-email/:token` (TTL 24h). Chưa verify → vẫn dùng được nhưng không mua vé.

**Rate limit chi tiết:**
| Endpoint | Limit |
|----------|-------|
| POST /register | 3/giờ per IP |
| POST /login | 5/phút per email |
| POST /forgot-password | 3/giờ per email |
| POST /lock-seats | 10/phút per user |
| General API | 100/phút per user |

### 5.6 Performance Optimization

- **Lazy loading routes:** `React.lazy()` + `Suspense` cho mỗi page. Admin bundle tách riêng khỏi customer.
- **Code splitting:** Vite automatic chunk splitting. Admin pages → chunk riêng (~200KB thay vì load cùng main).
- **Image optimization:** `loading="lazy"` cho ảnh event, responsive `srcset` (thumbnail 300w, banner 1200w). Backend: multer validate max 5MB, chỉ jpg/png/webp.
- **RTK Query cache:** Cache events list 60s, event detail 30s. Invalidate sau mutation (lock seats, checkout). Prefetch event detail khi hover event card.
- **Debounce/throttle:** Search input debounce 300ms. Seat map scroll throttle 16ms (60fps). WebSocket events batch 100ms.

### 5.7 Error Handling & Edge Cases

#### Network failures
| Tình huống | Giải pháp |
|-----------|-----------|
| Mất mạng giữa checkout | Booking persist server-side. Client: OfflineIndicator + retry button. Reconnect → resume booking |
| WebSocket disconnect | Socket.IO auto-reconnect. Sau reconnect: re-fetch full seat map + re-join room |
| API timeout | Client timeout 10s, retry 1 lần (exponential backoff). UI: "Đang xử lý, vui lòng chờ..." |
| Server restart | Booking persist DB. BullMQ restart → quét expired. Không mất data |

#### Business logic
| Tình huống | Giải pháp |
|-----------|-----------|
| Nhiều tab → duplicate booking | Backend: 1 user chỉ 1 booking pending per event (check trước lock) |
| Double-click checkout | Frontend: disable button + spinner. Backend: idempotency (status !== 'pending' → reject) |
| Booking expired đúng lúc checkout | Check expires_at TRONG transaction. 410 Gone + "Đã hết thời gian giữ chỗ" |
| Admin hủy event khi user chọn ghế | Soft delete (status → cancelled). Broadcast `event:cancelled`. Pending → expired, release seats |
| Token expired giữa thao tác | RTK Query baseQuery: auto gọi /refresh khi 401. Fail → redirect /login?returnUrl=... |

#### Infrastructure
| Tình huống | Giải pháp |
|-----------|-----------|
| Redis down | Graceful degradation: rate limit fallback in-memory, queue disabled (direct access), cache miss → DB |
| DB pool exhausted | Sequelize pool max 20. Overflow → 503 + "Hệ thống đang tải cao" |
| File upload fail | multer: max 5MB, jpg/png/webp only. Error → "Ảnh quá lớn hoặc sai định dạng" |

### 5.8 QR Code Security

```typescript
// Tạo QR: signed JWT
const qrPayload = { ticketId, eventId, userId, issuedAt: Date.now() };
const qrCode = jwt.sign(qrPayload, QR_SECRET, { expiresIn: '365d' });

// Verify: admin scan
const decoded = jwt.verify(qrCode, QR_SECRET);
const ticket = await Ticket.findByPk(decoded.ticketId);
if (ticket.status === 'used') throw new Error('Vé đã được sử dụng');
await ticket.update({ status: 'used', used_at: new Date() });
```

Frontend: QR hiển thị + animated timestamp overlay (xoay mỗi giây) — chống screenshot sharing.

### 5.9 Payment Gateway — VNPay + MoMo (Sandbox)

**Sandbox** (không charge tiền thật, dùng tài khoản test):

#### VNPay Sandbox
```typescript
// Tạo URL thanh toán VNPay
function createVnPayUrl(booking: Booking): string {
  const params = {
    vnp_Version: '2.1.0',
    vnp_TmnCode: VNPAY_TMN_CODE,    // Mã website test
    vnp_Amount: booking.total_amount * 100, // VNPay tính theo đồng × 100
    vnp_OrderInfo: `Thanh toán vé #${booking.id}`,
    vnp_ReturnUrl: `${API_URL}/api/payments/vnpay/return?bookingId=${booking.id}`,
    vnp_TxnRef: booking.id.toString(),
    // ... hash bằng VNPAY_HASH_SECRET
  };
  return `${VNPAY_URL}?${queryString}`;
}

// Xác nhận callback từ VNPay (GET /api/payments/vnpay/return)
async function vnPayReturn(query: VnPayReturnQuery) {
  // 1. Verify secure hash
  // 2. Check booking exists + status pending
  // 3. Update booking → confirmed, payment → completed
  // 4. Redirect về frontend:
  //    Thành công → redirect `${CLIENT_URL}/booking/${bookingId}/success`
  //    Thất bại  → redirect `${CLIENT_URL}/checkout/${bookingId}?error=payment_failed`
}
```

#### MoMo Sandbox
```typescript
// Tạo payment request MoMo
async function createMoMoPayment(booking: Booking) {
  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    requestId: `booking-${booking.id}-${Date.now()}`,
    amount: booking.total_amount,
    orderId: `BOOKING-${booking.id}`,
    orderInfo: `Thanh toán vé #${booking.id}`,
    redirectUrl: `${CLIENT_URL}/checkout/${booking.id}/momo-return`,
    ipnUrl: `${API_URL}/api/payments/momo/ipn`,
    requestType: 'payWithMethod',
    // ... sign bằng MOMO_SECRET_KEY
  };
  const response = await fetch(MOMO_ENDPOINT, { method: 'POST', body: JSON.stringify(body) });
  return response.json(); // { payUrl: '...' }
}
```

#### Checkout flow cập nhật
```
1. User chọn phương thức: "VNPay" / "MoMo" / "Giả lập"
2. VNPay/MoMo: redirect tới sandbox → user test thanh toán → redirect về /checkout/:id/return
3. Backend verify callback → update booking → confirmed
4. Giả lập: bấm "Xác nhận" → confirmed ngay
```

**Env vars thêm:**
```env
# VNPay Sandbox
VNPAY_TMN_CODE=your-sandbox-tmn-code
VNPAY_HASH_SECRET=your-sandbox-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# MoMo Sandbox
MOMO_PARTNER_CODE=your-sandbox-partner-code
MOMO_ACCESS_KEY=your-sandbox-access-key
MOMO_SECRET_KEY=your-sandbox-secret-key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
```

**DB:** Bảng `payments` cập nhật method enum: `ENUM('simulated','vnpay','momo')`. Thêm `transaction_id VARCHAR(100) NULL` (mã giao dịch từ VNPay/MoMo).

### 5.10 Data Cleanup (BullMQ Scheduled Jobs)

| Job | Tần suất | Hành động |
|-----|----------|-----------|
| Dọn expired bookings | Hàng ngày 3:00 AM | Xóa bookings status='expired' + created_at > 30 ngày |
| Dọn refresh_tokens | Hàng ngày 3:00 AM | Xóa tokens expires_at < now hoặc revoked=true > 7 ngày |
| Dọn notifications cũ | Hàng tuần | Xóa notifications is_read=true + created_at > 90 ngày |
| Dọn audit_logs | Hàng tháng | Xóa logs created_at > 365 ngày (archive trước nếu cần) |
| Dọn file uploads orphan | Hàng tuần | Scan thư mục uploads, xóa file không có reference trong DB |

```typescript
// jobs/dataCleanup.job.ts
const cleanupQueue = new Queue('data-cleanup', { connection: redisConnection });

// Chạy hàng ngày lúc 3:00 AM
await cleanupQueue.add('daily-cleanup', {}, {
  repeat: { pattern: '0 3 * * *' } // cron
});

const worker = new Worker('data-cleanup', async (job) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Booking.destroy({ where: { status: 'expired', created_at: { [Op.lt]: thirtyDaysAgo } } });
  await RefreshToken.destroy({ where: { [Op.or]: [
    { expires_at: { [Op.lt]: new Date() } },
    { revoked: true, created_at: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
  ]}});
  logger.info('Dọn dẹp data hoàn tất');
}, { connection: redisConnection });
```

### 5.11 Testing Strategy

#### Unit Tests (Vitest — frontend, Jest — backend)
| Module | Test coverage mục tiêu |
|--------|----------------------|
| Auth service (hash, JWT, lockout) | 90% |
| Booking service (lock, checkout, expire) | 95% |
| Queue service (join, grant, position) | 90% |
| Zod validation schemas | 100% |
| Utils (formatCurrency, formatDate, qrCode) | 100% |
| React hooks (useAuth, useSeatMap, useBookingTimer) | 80% |

#### Integration Tests (Supertest + test DB)
| Flow | Mô tả |
|------|--------|
| Auth flow | Register → verify email → login → refresh → logout |
| Booking flow | Lock seats → checkout → verify tickets created |
| Concurrency | 2 requests cùng lock 1 ghế → chỉ 1 thành công |
| Expiry | Lock → đợi expire → verify seats released |
| Queue | Join → grant batch → verify token works |
| Payment | VNPay/MoMo callback → verify booking confirmed |

#### E2E Tests (Playwright — optional, nếu đủ thời gian)
- Happy path: register → browse → chọn ghế → checkout → xem vé
- Admin path: login → tạo event → cấu hình ghế → publish

#### CI Pipeline (GitHub Actions)
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: ticketrush_test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - name: Install & test frontend
        run: cd frontend && npm ci && npm run lint && npm run test
      - name: Install & test backend
        run: cd backend && npm ci && npm run lint && npm run test
        env:
          DB_HOST: localhost
          DB_NAME: ticketrush_test
          REDIS_HOST: localhost
      - name: Build check
        run: cd frontend && npm run build && cd ../backend && npm run build
```

**Convention:**
- Test file cạnh source: `auth.service.ts` → `auth.service.test.ts`
- Test description tiếng Việt: `describe('lockSeats', () => { it('trả lỗi khi ghế đã bị lock', ...) })`
- Mỗi bug fix → viết failing test trước, fix sau

### 5.12 Event Status Lifecycle

```
draft ──[admin publish]──> published
published ──[sale_start_time đến (BullMQ scheduled)]──> on_sale
on_sale ──[tất cả ghế sold]──> sold_out
on_sale ──[end_time qua (BullMQ scheduled)]──> completed
sold_out ──[end_time qua]──> completed
BẤT KỲ ──[admin cancel]──> cancelled
```

Khi cancelled: pending bookings → expired (release ghế), confirmed bookings → refund flow.
BullMQ scheduled jobs: auto chuyển trạng thái khi đến giờ.

### 5.13 Accessibility

- **Seat map keyboard:** Arrow keys di chuyển focus, Enter chọn/bỏ ghế, Escape clear selection
- **Screen reader:** `aria-label="Ghế VIP-A1, giá 500.000₫, còn trống"` cho mỗi ghế
- **WCAG AA:** Color contrast 4.5:1 text, 3:1 UI. Ghế trạng thái phân biệt bằng icon + pattern (không chỉ màu)
- **Focus management:** Auto-focus element chính khi chuyển page, trap focus trong modal
- **Skip navigation:** Link ẩn "Bỏ qua đến nội dung chính"
- **Reduced motion:** `prefers-reduced-motion` → tắt Framer Motion animations
- **Alt text:** Tất cả ảnh event có alt text (event.title)
