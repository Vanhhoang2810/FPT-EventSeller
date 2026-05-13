# API Endpoints

> **TicketRush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | **API** | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../design.md)

---

## 4. API Endpoints

### Response format chuẩn

```json
{ "success": true, "data": {}, "message": "Thao tác thành công" }
{ "success": false, "message": "Mô tả lỗi", "errors": [] }
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 } }
```

### 4.1 Auth — `/api/auth`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/register` | No+CAPTCHA | Đăng ký. Body: email, password, fullName, turnstileToken |
| POST | `/login` | No+CAPTCHA | Đăng nhập. Trả accessToken + set refreshToken cookie |
| POST | `/google` | No | Google OAuth. Body: googleIdToken |
| POST | `/refresh` | Cookie | Làm mới access token |
| POST | `/logout` | Yes | Xóa refresh token |
| GET | `/me` | Yes | Thông tin user hiện tại |
| POST | `/verify-email` | No | Verify email. Body: token |
| POST | `/resend-verification` | Yes | Gửi lại email verify |
| POST | `/forgot-password` | No+CAPTCHA | Gửi email reset. Body: email |
| POST | `/reset-password` | No | Đặt lại mật khẩu. Body: token, newPassword |

### 4.2 Events — `/api/events`

> **Quan trọng:** Khi implement Express routes, đặt static paths (`/featured`, `/trending`, `/suggestions`, `/favorites`) **TRƯỚC** dynamic path `/:idOrSlug` để tránh route conflict.

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/` | No | Danh sách + search + filter. Query: search, category, status, startDate, endDate, page, limit, sort |
| GET | `/featured` | No | Sự kiện nổi bật + sắp mở bán |
| GET | `/trending` | No | Sự kiện hot (rank theo vé bán/views) |
| GET | `/suggestions` | No | Autocomplete search. Query: q (min 2 ký tự) |
| GET | `/favorites` | Yes | Danh sách sự kiện yêu thích |
| GET | `/:idOrSlug` | No | Chi tiết sự kiện *(đặt SAU static paths)* |
| GET | `/:id/seat-map` | No | Sơ đồ ghế (zones + seats + trạng thái) |
| POST | `/:id/favorite` | Yes | Toggle yêu thích sự kiện |
| POST | `/:id/remind` | Yes | Nhắc tôi khi mở bán (tạo notification scheduled) |

### 4.3 Booking — `/api/bookings`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/lock-seats` | Yes+Queue | ★ Lock ghế. Body: eventId, seatIds[] |
| GET | `/:id` | Yes | Chi tiết booking |
| POST | `/:id/checkout` | Yes | Xác nhận thanh toán. Body: method ('simulated'/'vnpay'/'momo'), promoCode? ← promo chỉ apply ở bước checkout |
| DELETE | `/:id` | Yes | Hủy booking, release ghế |

### 4.4 Tickets — `/api/tickets`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/` | Yes | Vé của tôi. Query: status, eventId |
| GET | `/:id` | Yes | Chi tiết vé + QR data |
| GET | `/:id/pdf` | Yes | Download vé dạng PDF |
| POST | `/verify` | Admin | Quét QR verify. Body: qrCode |

### 4.5 Users — `/api/users`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/profile` | Yes | Xem profile |
| PUT | `/profile` | Yes | Cập nhật profile |
| PUT | `/change-password` | Yes | Đổi mật khẩu |
| PUT | `/notification-settings` | Yes | Toggle email preferences |

### 4.6 Notifications — `/api/notifications`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/` | Yes | Danh sách thông báo (pagination) |
| PUT | `/:id/read` | Yes | Đánh dấu đã đọc |
| PUT | `/read-all` | Yes | Đánh dấu tất cả đã đọc |
| GET | `/unread-count` | Yes | Số thông báo chưa đọc |

### 4.7 Admin — `/api/admin`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/dashboard` | Admin | Stats tổng quan |
| GET | `/dashboard/revenue` | Admin | Doanh thu theo ngày/tuần/tháng |
| GET | `/dashboard/audience` | Admin | Thống kê khán giả |
| GET | `/dashboard/conversion` | Admin | Conversion funnel data |
| GET | `/dashboard/peak-hours` | Admin | Giờ cao điểm |
| GET | `/events` | Admin | Tất cả sự kiện |
| POST | `/events` | Admin | Tạo sự kiện |
| PUT | `/events/:id` | Admin | Sửa sự kiện |
| DELETE | `/events/:id` | Admin | Xóa sự kiện (chỉ khi chưa bán) |
| PUT | `/events/:id/status` | Admin | Đổi trạng thái |
| POST | `/events/:id/zones` | Admin | Cấu hình zones (bulk) |
| GET | `/events/:id/stats` | Admin | Stats sự kiện |
| GET | `/events/:id/bookings` | Admin | Bookings của sự kiện |
| GET | `/users` | Admin | Danh sách users |
| GET | `/users/:id` | Admin | User detail + booking history |
| PUT | `/users/:id/status` | Admin | Ban/unban user |
| GET | `/bookings` | Admin | Tất cả bookings |
| GET | `/bookings/:id` | Admin | Booking detail |
| POST | `/bookings/:id/refund` | Admin | Refund booking |
| GET | `/reports/export` | Admin | Export CSV/PDF. Query: type, dateRange, format |
| POST | `/events/:id/clone` | Admin | Clone sự kiện (copy settings, zones) |
| GET | `/venues` | Admin | Danh sách venues |
| POST | `/venues` | Admin | Tạo venue mới |
| PUT | `/venues/:id` | Admin | Sửa venue |
| DELETE | `/venues/:id` | Admin | Xóa venue (chỉ khi không có event nào dùng — FK constraint) |
| GET | `/promo-codes` | Admin | Danh sách mã giảm giá |
| POST | `/promo-codes` | Admin | Tạo mã giảm giá |
| PUT | `/promo-codes/:id` | Admin | Sửa mã giảm giá |
| DELETE | `/promo-codes/:id` | Admin | Xóa/vô hiệu mã |
| PUT | `/events/:id/queue` | Admin | Bật/tắt virtual queue. Body: enabled, batchSize |
| GET | `/audit-logs` | Admin | Xem audit trail. Query: action, entityType, dateRange, page |

### 4.8 Payments — `/api/payments`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/vnpay/create` | Yes | Tạo VNPay payment URL. Body: bookingId |
| GET | `/vnpay/return` | No | VNPay redirect callback (verify hash → update booking) |
| POST | `/momo/create` | Yes | Tạo MoMo payment URL. Body: bookingId |
| POST | `/momo/ipn` | No (MoMo server) | MoMo IPN callback (verify signature) |

### 4.9 Promo Codes — `/api/promo`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/validate` | Yes | Kiểm tra mã. Body: code, eventId, amount. Trả discount |

### 4.10 Health — `/api`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/health` | No | Health check: DB, Redis, BullMQ status |

### 4.11 Queue — `/api/queue`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/join/:eventId` | Yes | Tham gia hàng chờ |
| GET | `/status/:eventId` | Yes | Vị trí hiện tại |

### 4.12 WebSocket Events

```
Client → Server:
  seat:join-room        { eventId }
  seat:leave-room       { eventId }
  queue:join             { eventId }
  admin:join             {}                              // Admin dashboard room

Server → Client:
  seat:updated           { seatId, status, lockedBy }
  seat:bulk-updated      { seats: [...] }
  queue:position         { position, estimatedWait }
  queue:granted          { token, expiresAt }
  booking:expired        { bookingId }
  event:cancelled        { eventId, message }
  notification:new       { id, type, title, message, link }
  admin:activity         { type, userId, eventId, action, timestamp }  // Live feed
  admin:seat-stats       { eventId, filled, total }                     // Seat fill update
  admin:revenue-update   { amount, eventId, timestamp }                 // Revenue tick
```
