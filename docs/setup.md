# Setup môi trường dev

> **TicketRush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | **Setup** | [Design](../DESIGN.md)

---

## 12. Setup môi trường dev

### 12.1 Yêu cầu

- Node.js 22 LTS, XAMPP (MySQL + phpMyAdmin), Redis (Memurai trên Windows hoặc WSL2/Docker), Git, VS Code

### 12.2 Khởi tạo

```bash
# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npx shadcn@latest init
npm install @reduxjs/toolkit react-redux react-router-dom socket.io-client
npm install framer-motion react-hook-form @hookform/resolvers zod
npm install recharts qrcode.react lucide-react sonner react-to-print js-cookie
npm install @react-oauth/google @marsidev/react-turnstile
npm install @use-gesture/react vaul embla-carousel-react react-imask
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
npm install -D @types/node @types/js-cookie

# Backend
cd .. && mkdir backend && cd backend && npm init -y
npm install express cors helmet morgan cookie-parser compression
npm install sequelize mysql2 ioredis bullmq
npm install jsonwebtoken argon2 zod uuid qrcode
npm install socket.io multer winston nodemailer csv-writer
npm install passport passport-google-oauth20 google-auth-library vnpay axios
npm install swagger-ui-express swagger-jsdoc pdfkit
npm install express-rate-limit rate-limit-redis express-slow-down
npm install -D typescript ts-node nodemon
npm install -D @types/express @types/cors @types/jsonwebtoken
npm install -D @types/cookie-parser @types/morgan @types/uuid
npm install -D @types/nodemailer @types/passport @types/passport-google-oauth20
npm install -D @types/multer @types/pdfkit @types/express-slow-down @types/qrcode @types/compression
npx tsc --init && npx sequelize-cli init
```

### 12.3 Biến môi trường (`.env.example`)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=ticketrush
DB_USER=root
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
QR_SECRET=your-qr-signing-secret

CLIENT_URL=http://localhost:5173
SEAT_LOCK_TIMEOUT=600000
API_URL=http://localhost:3001
QUEUE_THRESHOLD=200

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

TURNSTILE_SECRET_KEY=your-turnstile-secret

# Frontend env vars (prefix VITE_ cho Vite expose)
# Tạo file frontend/.env với:
# VITE_API_URL=http://localhost:3001/api
# VITE_SOCKET_URL=http://localhost:3001
# VITE_GOOGLE_CLIENT_ID=your-google-client-id
# VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ticketrush.notify@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=TicketRush <ticketrush.notify@gmail.com>

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

---

## 13. Ghi chú

1. **Thanh toán giả lập** — bấm "Xác nhận" = thành công. Không cổng thanh toán thật.
2. **Ưu tiên demo flow** hoạt động hơn feature nhiều nhưng lỗi.
3. **Seed data đẹp** — ảnh event thật, tên sự kiện thật, nhiều zones.
4. **Test concurrency** — 2 browser, 2 account, cùng 1 ghế → chỉ 1 thành công.
5. **Redis Windows** — Memurai hoặc WSL2/Docker. Không có Redis → in-memory fallback.
6. **Email templates** — HTML responsive, có logo TicketRush, auto-generate bằng nodemailer.
