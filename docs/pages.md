# Frontend Pages

> **Ticket Rush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | **Pages** | [Security](security.md) | [Setup](setup.md) | [Design](../DESIGN.md)

---

## 6. Frontend Pages

### 6.1 Landing Page (`/`)

| Section | Mô tả |
|---------|--------|
| **Immersive Hero** | Full-viewport featured event — ảnh event lớn + parallax + ambient gradient (màu trích từ ảnh). Tên event + ngày + CTA "Mua vé ngay" |
| **Quick Search + Chips** | Search bar nổi bật + chips: "Hôm nay", "Tuần này", "Nhạc", "Thể thao", "Kịch"... |
| **Sắp mở bán** | Carousel events sắp on_sale + countdown timer + nút "Nhắc tôi" |
| **Đang trending** | Grid/carousel events hot (rank theo vé bán, có badge "Hot", "Sắp hết") |
| **Categories** | Horizontal scrollable category chips với icon |
| **How it works** | 1 row inline: 3 icons (Chọn → Đặt → Nhận QR) — nhỏ gọn |
| **Footer** | Logo, links (About, FAQ, Terms, Privacy, Contact), mạng xã hội, newsletter input nhỏ |
| **Atmosphere** | Background: gradient blobs + noise texture + subtle particle animation |

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Full hero + 4-col grid | Hero 80% + 2-col | Hero stack, 1-col, swipe carousel |

### 6.2 Events Page (`/events`)

- **Autocomplete search** (debounce 300ms, dropdown suggestions từ API `/suggestions`)
- Filter: thể loại, khoảng ngày, khoảng giá, trạng thái
- Toggle grid/list view, sort (mới nhất, sắp diễn ra, giá thấp→cao)
- Event cards: glassmorphism overlay, "Từ 500.000₫", badges ("Hot"/"Mới"/"Sắp hết")
- Infinite scroll, skeleton loading

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Sidebar filter + 3-col grid | Collapse filter + 2-col | Filter = bottom sheet (vaul), 1-col, pull to refresh |

### 6.3 Event Detail (`/events/:slug`)

- Hero banner (ảnh lớn + gradient overlay + ambient background)
- Thông tin: tên, ngày, giờ, địa điểm (Google Maps link), mô tả
- Bảng giá (zone, giá, ghế còn trống — auto-format VND: 1.000.000₫)
- CTA: "Chọn ghế" (sticky bottom trên mobile)
- Share buttons, related events
- **Breadcrumb:** Trang chủ > Nhạc > Tên sự kiện

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Hero + side panel | Stack layout | Stack, CTA sticky bottom |

### 6.4 Seat Selection (`/events/:id/seats`)

- ★ **Sơ đồ ghế interactive** — SVG/Canvas grid
- Màu: xanh lá (available), xám (sold), vàng (locked), cam (bạn chọn), xám đậm nét đứt (disabled) — xem DESIGN.md Section 2.7
- Real-time updates qua WebSocket
- **Keyboard:** Arrow keys navigate, Enter select, Escape clear
- **Screen reader:** aria-label cho mỗi ghế
- Legend (chú thích), sidebar (ghế đã chọn + tổng tiền)

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Full map + sidebar phải | Map 80% + sidebar overlay | **Fullscreen map, pinch zoom, pan gesture, mini-map góc**, bottom sheet chọn ghế |

### 6.5 Checkout (`/checkout/:bookingId`)

- Layout minimal (không header/footer)
- **Countdown timer** nổi bật (đổi amber khi <2 phút, đổi đỏ + nhấp nháy khi <30 giây — theo DESIGN.md §5.13)
- Tóm tắt: sự kiện, ghế, giá, tổng (auto-format VND)
- **Chọn phương thức thanh toán:** Radio buttons: VNPay / MoMo / Giả lập
  - VNPay: FE gọi `POST /payments/vnpay/create` → nhận URL → redirect VNPay sandbox → VNPay callback `GET /api/payments/vnpay/return` (backend verify) → backend redirect FE `/booking/:id/success` hoặc `/checkout/:id?error=payment_failed`
  - MoMo: FE gọi `POST /payments/momo/create` → nhận payUrl → redirect MoMo sandbox → MoMo redirect FE `/checkout/:id/momo-return` → CheckoutPage detect param → gọi API verify → redirect `/booking/:id/success`
  - Giả lập: bấm xác nhận → gọi `POST /bookings/:id/checkout` → thành công ngay
- **Payment return handling:** VNPay → backend xử lý + redirect FE (không qua CheckoutPage). MoMo → redirect FE `/checkout/:id/momo-return` → CheckoutPage detect param → gọi verify API → redirect success/error
- Nút "THANH TOÁN" (disable sau click + spinner — chống double-click)
- Autofill thông tin user (tên, email, SĐT từ profile)
- Hết hạn → redirect event + toast "Đã hết thời gian giữ chỗ"

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| 2-col (summary + form) | Stack | Stack, countdown sticky top |

### 6.6 Booking Success (`/booking/:id/success`)

- Checkmark animation (Framer Motion) + confetti
- Thông tin: mã đơn, sự kiện, ghế, tổng tiền
- "Xem vé" + "Quay về trang chủ"

### 6.7 My Tickets (`/my-tickets`)

- Grid cards vé (tên event, ngày, ghế, status badge)
- Click → detail + QR (fullscreen khi click QR + animated overlay)
- Filter: sắp tới / đã qua / đã hủy
- Empty state với illustration

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Grid cards | 2-col | 1-col, swipe between tickets |

### 6.8 Auth Pages (`/login`, `/register`)

- Layout centered card
- React Hook Form + Zod validation real-time
- **Google login button** (nổi bật, "Đăng nhập bằng Google")
- **Cloudflare Turnstile** CAPTCHA widget
- Show/hide password, "Nhớ đăng nhập"
- Error messages tiếng Việt, link login ↔ register
- **Sau login (role-based redirect):** admin → `/admin`, customer → `/` (hoặc returnUrl nếu có)
- **Sau register:** redirect verify-email page, gửi email
- **Phone input:** mask `0912 345 678`

### 6.9 User Profile (`/profile`)

- Avatar upload (preview trước save)
- Form: họ tên, email (readonly), SĐT (mask), ngày sinh (date picker), giới tính
- Đổi mật khẩu
- Lịch sử đặt vé
- **Notification settings:** toggle bật/tắt từng loại email

### 6.10 Waiting Room (`/queue/:eventId`)

- Layout minimal, centered, atmosphere background
- Số thứ tự lớn + animation chờ
- Estimated wait time, progress bar
- "Vui lòng không tải lại trang" (position persist — refresh OK)
- Đến lượt → auto redirect seat selection + sound notification

### 6.11 Admin Dashboard (`/admin`)

- Sidebar navigation (collapse trên mobile → bottom nav)
- **Stats cards** + trend sparklines (so sánh hôm qua)
- **Revenue chart:** line chart theo ngày/tuần/tháng (Recharts)
- **Seat fill rate:** bar chart per event (real-time via WebSocket)
- **Audience demographics:** pie chart giới tính, bar chart nhóm tuổi
- **Conversion funnel:** View → Select seat → Lock → Checkout → Confirm
- **Peak hours:** heatmap giờ cao điểm mua vé
- **Recent bookings:** table 10 đơn gần nhất
- **Live activity feed:** real-time (WebSocket)

| Desktop | Tablet | Mobile |
|---------|--------|--------|
| Sidebar + chart grid | Sidebar collapse + stack | Bottom nav, charts full-width |

### 6.12 Admin Event Management (`/admin/events`)

- Table: tên, ngày, trạng thái badge, vé bán/tổng, doanh thu, actions
- Search + filter, nút tạo mới

### 6.13 Admin Event Create/Edit

- Step 1: Thông tin cơ bản (tên, mô tả, banner upload, thể loại, ngày giờ)
- Step 2: Chọn/tạo venue
- Step 3: SeatMapBuilder (zones + preview real-time)
- Step 4: Bán vé (mở/đóng bán, giới hạn, virtual queue)
- Step 5: Preview & Publish
- **Auto-save draft** (localStorage)

### 6.14 Admin User Management (`/admin/users`)

- Table: tên, email, ngày tạo, vé đã mua, trạng thái, actions
- Search, filter (role, status)
- Click row → detail + booking history
- Ban/unban button

### 6.15 Admin Booking Management (`/admin/bookings`)

- Table: mã đơn, user, event, ghế, tổng tiền, trạng thái, ngày tạo
- Search, filter (status, event, date range)
- Click row → detail
- Refund action (confirmed → refunded)

### 6.16 Admin Reports (`/admin/reports`)

- Revenue report (date range selector)
- Event comparison (so sánh 2+ events)
- Export CSV button
- Seat heatmap (ghế nào bán nhanh nhất)

### 6.17 Static Pages

- **About** (`/about`): Giới thiệu Ticket Rush, đội ngũ (mock), mission
- **FAQ** (`/faq`): Accordion list câu hỏi thường gặp
- **Terms** (`/terms`): Điều khoản sử dụng
- **Privacy** (`/privacy`): Chính sách bảo mật
- **Contact** (`/contact`): Form liên hệ + thông tin

### 6.18 Admin Promo Codes (`/admin/promo-codes`)

- Table: mã, loại giảm (% / fixed), giá trị, event áp dụng, hạn dùng, đã dùng/tổng, trạng thái, actions
- Search + filter (active/expired, event)
- Nút tạo mã mới → form: code, discount_type, value, max_discount, event (optional), usage_limit, per_user_limit, min_amount, starts_at, expires_at
- Edit / vô hiệu mã

### 6.19 Admin Venues (`/admin/venues`)

- Table: tên, địa chỉ, thành phố, sức chứa, actions
- Tạo / sửa venue (form nhỏ, dùng modal)

### 6.20 Admin Audit Logs (`/admin/audit-logs`)

- Table read-only: thời gian, admin, hành động, entity, IP
- Filter: action type, date range
- Không có edit/delete (chỉ xem)

### 6.21 Error & Utility Pages

- **404:** Illustration + "Trang không tồn tại" + quay về
- **500:** "Đã xảy ra lỗi" + thử lại
- **Offline:** Indicator bar + retry
- **Loading:** Skeleton screens per page type
