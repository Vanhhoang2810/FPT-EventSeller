# Hướng dẫn cài đặt & chạy

> **Ticket Rush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | **Setup** | [Design](../DESIGN.md)

---

## 1. Yêu cầu hệ thống

| Phần mềm | Phiên bản | Ghi chú |
|-----------|-----------|---------|
| **Node.js** | 22 LTS | [nodejs.org/download](https://nodejs.org) |
| **MySQL** | 8.x | XAMPP hoặc standalone |
| **Redis** | 7.x | Windows: tải từ [GitHub releases](https://github.com/tporadowski/redis/releases) hoặc dùng [Memurai](https://www.memurai.com/) |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com) |
| **VS Code** | latest | Khuyến nghị, không bắt buộc |

---

## 2. Clone & cài đặt

```bash
git clone <repo-url>
cd TicketRush

# Frontend
cd frontend
npm install
cp .env.example .env

# Backend
cd ../backend
npm install
cp .env.example .env
```

---

## 3. Cấu hình biến môi trường

### 3.1 Backend (`backend/.env`)

Copy từ `backend/.env.example` và điền giá trị thật:

```env
# ===== Database =====
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ticketrush
DB_USER=root
DB_PASSWORD=

# ===== Redis =====
REDIS_HOST=localhost
REDIS_PORT=6379

# ===== JWT =====
JWT_ACCESS_SECRET=<random-string-32-chars>
JWT_REFRESH_SECRET=<random-string-32-chars>
JWT_ACCESS_EXPIRES=2h
JWT_REFRESH_EXPIRES=7d
QR_SECRET=<random-string-32-chars>

# ===== URLs =====
API_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# ===== SMTP =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>@gmail.com
SMTP_PASS=<16-char-app-password>
SMTP_FROM=TicketRush <your-email@gmail.com>

# ===== Cloudflare Turnstile =====
TURNSTILE_SECRET_KEY=<your-secret-key>

# ===== VNPay Sandbox =====
VNPAY_TMN_CODE=<your-tmn-code>
VNPAY_HASH_SECRET=<your-hash-secret>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# ===== MoMo Sandbox =====
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# ===== Queue =====
SEAT_LOCK_TIMEOUT=600000
QUEUE_THRESHOLD=200
```

### 3.2 Frontend (`frontend/.env`)

```env
VITE_GOOGLE_CLIENT_ID=<same-as-backend>
VITE_TURNSTILE_SITE_KEY=<from-cloudflare-dashboard>
VITE_SOCKET_URL=
```

---

## 4. Database setup

```bash
# Tạo database trong MySQL (phpMyAdmin hoặc CLI)
mysql -u root -e "CREATE DATABASE ticketrush CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Chạy migrations + seed data
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Tài khoản seed

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@ticketrush.vn` | `Admin@12345` |
| **Customer** | `user@ticketrush.vn` | `User@12345` |

---

## 5. Chạy development

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Mở browser: **http://localhost:5173**

---

## 6. Setup Google OAuth

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. **APIs & Services → OAuth consent screen** → External → điền App name, email
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
5. Copy **Client ID** và **Client Secret** vào cả `backend/.env` và `frontend/.env`

---

## 7. Setup SMTP (Gmail)

1. Vào [Google Account → Security](https://myaccount.google.com/security)
2. Bật **2-Step Verification**
3. Vào **App passwords** → tạo password cho "Mail"
4. Copy 16-char app password vào `backend/.env` → `SMTP_PASS`

---

## 8. Setup VNPay Sandbox

1. Đăng ký tại: **https://sandbox.vnpayment.vn/devreg/**
   - Tên website: `TicketRush`
   - URL: `http://localhost:3001`
   - Email: email của bạn
2. Nhận email chứa **TmnCode** + **HashSecret** → điền vào `backend/.env`
3. Login merchant portal: **https://sandbox.vnpayment.vn/merchantv2/**
4. Cài đặt **IPN URL**: `<ngrok-url>/api/payments/vnpay/ipn` (nếu test IPN)

### Thẻ test VNPay

| Field | Giá trị |
|-------|---------|
| Ngân hàng | NCB |
| Số thẻ | `9704198526191432198` |
| Tên chủ thẻ | `NGUYEN VAN A` |
| Ngày phát hành | `07/15` |
| OTP | `123456` |

---

## 9. Setup MoMo Sandbox

MoMo sandbox credentials (public, từ docs MoMo):

```env
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
```

**Lưu ý**: MoMo sandbox redirect cần **public URL** (không redirect về `localhost`). Dùng ngrok:

```bash
# Cài ngrok: https://ngrok.com/download
ngrok http 3001

# Copy URL https://xxx.ngrok-free.app → backend/.env
API_URL=https://xxx.ngrok-free.app
# CLIENT_URL giữ nguyên localhost (browser redirect)
CLIENT_URL=http://localhost:5173
```

---

## 10. Setup Cloudflare Turnstile (CAPTCHA)

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → Turnstile
2. Add site → Domain: `localhost`
3. Copy **Site Key** → `frontend/.env` → `VITE_TURNSTILE_SITE_KEY`
4. Copy **Secret Key** → `backend/.env` → `TURNSTILE_SECRET_KEY`

> Nếu không setup Turnstile, login/register vẫn hoạt động (middleware skip khi key trống)

---

## 11. Scripts

### Frontend

```bash
npm run dev        # Dev server (Vite, port 5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
npm run test       # Vitest
```

### Backend

```bash
npm run dev        # Dev server (nodemon, port 3001)
npm run build      # TypeScript compile
npm run start      # Production
npm run test       # Jest + Supertest
npm run lint       # ESLint
```

### Database

```bash
npx sequelize-cli db:migrate              # Chạy migrations
npx sequelize-cli db:seed:all             # Seed data mẫu
npx sequelize-cli db:migrate:undo:all     # Rollback tất cả
npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all  # Reset
```

---

## 12. Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| `EADDRINUSE :3001` | `netstat -ano \| findstr :3001` → `taskkill /F /PID <pid>` |
| Redis connection refused | Kiểm tra Redis đã chạy: `redis-cli ping` → `PONG` |
| MySQL access denied | Kiểm tra `DB_USER`, `DB_PASSWORD` trong `.env` |
| VNPay "Sai chữ ký" | Kiểm tra `VNPAY_HASH_SECRET` đúng chưa, restart backend |
| MoMo 503 | Cần ngrok cho `API_URL`, MoMo không redirect về localhost |
| Google OAuth 500 | Kiểm tra `GOOGLE_CLIENT_ID` trong cả backend + frontend `.env` |
| Favicon cũ (Vite tím) | Clear browser cache: `Ctrl+Shift+R` hoặc Incognito tab |
| Logout khi reload | Kiểm tra cookie `refreshToken` trong DevTools → Application → Cookies |
