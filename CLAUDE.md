# Ticket Rush — Project Instructions

## Ngôn ngữ
- Code (biến, hàm, class, file, branch): **tiếng Anh**
- Comment, commit message, error message, UI text, docstring: **tiếng Việt**
- Thuật ngữ kỹ thuật giữ nguyên tiếng Anh

## Tech stack
- **Frontend**: React 19, Vite 6, TypeScript, TailwindCSS 4, Redux Toolkit (RTK Query), React Router 7, Socket.IO Client, react-i18next, Framer Motion
- **Backend**: Node.js 22, Express 5, TypeScript, Sequelize 6, MySQL 8, Redis 7 (ioredis), BullMQ, Socket.IO 4, Passport (Google OAuth), Nodemailer
- **Payments**: VNPay sandbox, MoMo sandbox
- **Testing**: Jest + Supertest (BE), Vitest (FE)
- Chi tiết: `docs/tech-stack.md`

## Cấu trúc dự án
- Frontend: feature-based (`src/features/[module]/pages|components|services|store`)
- Backend: module-based layered (`src/modules/[module]/controller+service+routes+validation`)
- Database: 20 bảng, Sequelize ORM, migrations + seeders
- Chi tiết: `docs/folder-structure.md`, `docs/database.md`

## Tài liệu
- `docs/` chứa 9 file tài liệu kỹ thuật
- `docs/plan.md` — hub file: overview, phases, mapping tiêu chí
- `DESIGN.md` — design system (colors, components, animations)
- `CONTEXT.md` — đề bài gốc (nguồn sự thật, **không được sửa**)

## Quy tắc khi implement

### Docs-sync
Khi implement mà phát hiện docs **sai, thiếu, hoặc conflict** với code thực tế:
1. Sửa docs ngay trong cùng commit
2. Ưu tiên: code đúng > docs đúng

### Design system
- Glassmorphism 2.0: `backdrop-blur` + semi-transparent backgrounds + subtle borders
- Color palette: emerald (`#059669`) primary, orange (`#F97316`) accent
- Light/dark mode: dùng `text-primary-700 dark:text-primary-400` cho text trên nền trắng
- Buttons: dùng `btn-glass` class, `hover:opacity-90`
- Cards: `rounded-2xl border border-border bg-card`

### Key patterns đã establish
- **Booking flow**: lockSeats (pessimistic locking) → checkout (promo + payment) → confirmBooking (tickets + QR)
- **Auth**: JWT access (2h) + refresh token (7d, HttpOnly cookie, rotation with LOCK.UPDATE)
- **Socket.IO**: rooms `event:${id}`, `chat:${id}`, `admin:dashboard`, `user:${id}`
- **Chat**: optionalAuth middleware, visitorId ownership checks
- **VNPay**: `sortObject` with `encodeURIComponent` + `%20→+`, `qs.stringify({encode:false})`
- **Queue**: Redis sorted set + MULTI/EXEC atomic grant + reverse token lookup
- **i18n**: `useTranslation('namespace')`, keys trong `locales/{vi,en}/*.json`

### Lệnh chạy
```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev

# DB migrate + seed
cd backend && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all

# Tests
cd backend && npm test
cd frontend && npm test
```

### Tài khoản seed
- Admin: `admin@ticketrush.vn` / `Admin@12345`
- User: `user@ticketrush.vn` / `User@12345`

## Testing
- Backend: Jest + Supertest
- Frontend: Vitest
- Test description tiếng Việt
- Mỗi bug fix → viết failing test trước

## Git
- Branch: `feat/`, `fix/`, `refactor/`, `docs/`
- Commit: Conventional Commits, subject tiếng Việt
- Không `git add .` — add từng file
