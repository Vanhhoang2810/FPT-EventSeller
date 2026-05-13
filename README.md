# 🎫 TicketRush

Nền tảng đặt vé sự kiện online — real-time seat map, flash sale ready, virtual queue.

> **Bài tập lớn** — INT3306 Phát triển ứng dụng web | Spring 2026

---

## Tính năng chính

### Customer
- Tìm kiếm, lọc sự kiện (autocomplete, filter theo thể loại/ngày/giá)
- Sơ đồ ghế interactive real-time (WebSocket, pinch zoom mobile)
- Đặt vé + giữ chỗ 10 phút (pessimistic locking, chống race condition)
- Thanh toán VNPay / MoMo (sandbox) + giả lập
- Vé điện tử QR Code (signed JWT) + download PDF
- Hàng chờ ảo (Virtual Queue) khi traffic cao
- Yêu thích sự kiện, mã giảm giá, thông báo real-time + email
- Đa ngôn ngữ (Tiếng Việt / English)

### Admin
- Dashboard real-time: doanh thu, tỉ lệ lấp đầy, demographics, conversion funnel
- Quản lý sự kiện (CRUD wizard 5 bước + seat map builder)
- Quản lý user (danh sách, ban/unban)
- Quản lý booking (tìm kiếm, refund)
- Mã giảm giá, venues, export báo cáo CSV/PDF
- Clone sự kiện

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19, Vite 6, TypeScript, TailwindCSS 4, shadcn/ui, Redux Toolkit (RTK Query), React Router 7, Framer Motion, Socket.IO Client, react-i18next |
| Backend | Node.js 22, Express 5, TypeScript, Sequelize 6 (MySQL), Redis 7 (ioredis), BullMQ, Socket.IO 4, Passport (Google OAuth), Nodemailer |
| Database | MySQL 8 (XAMPP), Redis 7 |
| Payment | VNPay sandbox, MoMo sandbox |
| Testing | Vitest (FE), Jest + Supertest (BE), GitHub Actions CI |
| Docs | Swagger UI (`/api-docs`) |

---

## Cấu trúc project

```
TicketRush/
├── frontend/          # React SPA
├── backend/           # Express API
├── docs/              # Tài liệu kỹ thuật (9 files)
│   ├── plan.md        # Tổng quan + phases + mapping tiêu chí
│   ├── tech-stack.md
│   ├── folder-structure.md
│   ├── database.md    # Schema 15 bảng + ERD
│   ├── api.md         # 60+ endpoints + WebSocket events
│   ├── technical.md   # Concurrency, queue, payments, testing, edge cases
│   ├── pages.md       # 30+ frontend pages chi tiết
│   ├── security.md    # Auth flow, rate limit, DDoS, checklist
│   └── setup.md       # Hướng dẫn cài đặt
├── DESIGN.md          # Design system (1000+ dòng): colors, components, wireframes
├── CONTEXT.md         # Đề bài gốc
└── README.md
```

---

## Cài đặt & Chạy

### Yêu cầu
- Node.js 22 LTS
- XAMPP (MySQL 8 + phpMyAdmin)
- Redis 7 (Windows: [Memurai](https://www.memurai.com/) hoặc WSL2/Docker)
- Git

### Bước 1: Clone & cài đặt

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

### Bước 2: Cấu hình

Sửa file `backend/.env`:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` — kết nối MySQL
- `REDIS_HOST`, `REDIS_PORT` — kết nối Redis
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — random string ≥32 ký tự
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — từ Google Cloud Console
- `SMTP_USER`, `SMTP_PASS` — Gmail App Password
- `VNPAY_*`, `MOMO_*` — sandbox credentials

Sửa file `frontend/.env`:
- `VITE_API_URL=http://localhost:3001/api`
- `VITE_SOCKET_URL=http://localhost:3001`
- `VITE_GOOGLE_CLIENT_ID` — same as backend
- `VITE_TURNSTILE_SITE_KEY` — từ Cloudflare dashboard

### Bước 3: Database

```bash
# Tạo database trong phpMyAdmin: ticketrush
cd backend
npm run db:migrate
npm run db:seed
```

### Bước 4: Chạy

```bash
# Terminal 1 — Backend
cd backend
npm run dev          # http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev          # http://localhost:5173
```

### Tài khoản test (sau khi seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketrush.vn | Admin@123 |
| Customer | user@ticketrush.vn | User@123 |

---

## API Documentation

Sau khi chạy backend: [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (Swagger UI)

---

## Tài liệu

| File | Nội dung |
|------|----------|
| [docs/plan.md](docs/plan.md) | Tổng quan, phases triển khai, mapping tiêu chí chấm điểm |
| [docs/tech-stack.md](docs/tech-stack.md) | Danh sách công nghệ + lý do chọn |
| [docs/folder-structure.md](docs/folder-structure.md) | Cấu trúc thư mục frontend + backend |
| [docs/database.md](docs/database.md) | Schema 15 bảng, ERD, associations |
| [docs/api.md](docs/api.md) | 60+ API endpoints, WebSocket events |
| [docs/technical.md](docs/technical.md) | Giải pháp kỹ thuật: concurrency, queue, payments, testing |
| [docs/pages.md](docs/pages.md) | 30+ frontend pages + responsive specs |
| [docs/security.md](docs/security.md) | Auth flow, OAuth2, rate limit, DDoS, checklist |
| [docs/setup.md](docs/setup.md) | Hướng dẫn cài đặt chi tiết |
| [DESIGN.md](DESIGN.md) | Design system: colors, typography, components, wireframes, animations |

---

## Scripts

### Frontend
```bash
npm run dev        # Dev server (Vite)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
npm run test       # Vitest
```

### Backend
```bash
npm run dev        # Dev server (nodemon)
npm run build      # TypeScript compile
npm run start      # Production start
npm run db:migrate # Chạy migrations
npm run db:seed    # Seed data mẫu
npm run db:reset   # Reset DB (migrate undo + migrate + seed)
npm run test       # Jest
npm run lint       # ESLint check
```

---

## Tiêu chí chấm điểm

| # | Tiêu chí | Hệ số | Giải pháp |
|---|----------|-------|-----------|
| 1 | Chức năng & features | 0.35 | Xem [docs/plan.md](docs/plan.md) §11 |
| 2 | Thiết kế logic | 0.10 | Booking flow, admin wizard, a11y |
| 3 | Giao diện đẹp, bản sắc | 0.20 | Xem [DESIGN.md](DESIGN.md) — entertainment vibe |
| 4 | Hiệu năng | 0.10 | SPA, RTK Query, WebSocket, lazy loading |
| 5 | Phong cách lập trình | 0.05 | Feature-based, Controller-Service-Model, TypeScript |
| 6 | Xử lý nhập liệu | 0.05 | Zod, autocomplete, phone mask, currency format |
| 7 | An ninh | 0.05 | Xem [docs/security.md](docs/security.md) |
| 8 | URL routing | 0.05 | React Router, slug URLs, backend rewrite |
| 9 | ORM & DB independence | 0.05 | Sequelize ORM, migrations |

---

## Nhóm thực hiện

| Thành viên | MSSV | Vai trò |
|-----------|------|---------|
| ... | ... | ... |
| ... | ... | ... |
| ... | ... | ... |

> **INT3306** — Phát triển ứng dụng web — Spring 2026
