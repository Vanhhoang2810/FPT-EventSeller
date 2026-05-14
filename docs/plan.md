# Ticket Rush — Kế hoạch triển khai chi tiết

> Nền tảng đặt vé sự kiện online — entertainment-focused, chịu tải flash sale, real-time seat map.

> **Ticket Rush Docs** | **Tổng quan** | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../DESIGN.md)

---

## Mục lục

| File | Mô tả |
|------|--------|
| [Tech Stack](tech-stack.md) | Frontend & Backend libraries, phiên bản, lý do chọn |
| [Folder Structure](folder-structure.md) | Cấu trúc thư mục monorepo: frontend feature-based + backend module-based |
| [Database](database.md) | ERD, chi tiết 15 bảng, indexes, locking strategy |
| [API](api.md) | REST endpoints, response format, WebSocket events |
| [Technical](technical.md) | Giải pháp kỹ thuật: concurrency, real-time, queue, payment, testing |
| [Pages](pages.md) | Frontend pages chi tiết: layout, responsive, UX |
| [Security](security.md) | Routing + Authentication + Security checklist + Rate limiting + DDoS |
| [Setup](setup.md) | Setup môi trường dev, cài đặt, biến môi trường |
| [Design](../DESIGN.md) | Design system chi tiết (file riêng) |

---

## 9. Design System (→ chi tiết trong `DESIGN.md`)

### 9.1 Visual Direction

**Vibe: Entertainment/Festival** — immersive, bold, dynamic. KHÔNG SaaS/corporate.

| Thuộc tính | Giá trị |
|------------|---------|
| Primary | Emerald (#059669 → #047857 gradient) — sang trọng, exclusive |
| Accent | Coral/Orange (#F97316) — CTA, urgency |
| Success | Teal (#14B8A6) — phân biệt với primary |
| Warning | Amber (#F59E0B) |
| Error | Rose (#F43F5E) |
| Neutral | Zinc scale |
| Dark mode | Default (entertainment = dark) |
| Font heading | Space Grotesk (display, personality) |
| Font body | Inter |
| Icons | Lucide React (consistent, tree-shakable) |

### 9.2 Brand Identity

- **Logo:** "Ticket Rush" — chữ T+R liền, hiệu ứng tốc độ (speed lines)
- **Motifs:** Ticket-shaped elements, stage silhouette, spotlight beams
- **Atmosphere:** Gradient blobs, noise texture, subtle particles
- **Cards:** Glassmorphism overlay trên ảnh event, hover zoom + shadow lift
- **Background:** Dark + gradient blobs (KHÔNG solid color flat)

### 9.3 Responsive & Mobile

- Mobile-first approach (Tailwind: build cho mobile, mở rộng md:, lg:)
- Touch targets: min 44×44px
- Seat map: pinch zoom + pan + mini-map
- Bottom sheet (vaul): filter, booking summary
- Safe area: `env(safe-area-inset-*)`
- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover`
- PWA: manifest.json + offline page

### 9.4 Animations

- Page transitions: Framer Motion fade+slide
- Seat map: hover scale, click pulse, color transition 300ms
- Countdown: digit flip <60s, red flash <30s
- Loading: skeleton shimmer
- Toast: slide in, auto-dismiss 4s
- Queue: particle/wave background
- `prefers-reduced-motion`: tắt tất cả

---

## 10. Phân chia Phases

### Phase 1: Foundation (Ngày 1-3) ✅ COMPLETED

- [x] Init monorepo: Vite + React + TailwindCSS 4 + shadcn/ui + Express + TypeScript
- [x] ESLint, Prettier
- [x] Sequelize + MySQL + Redis, tạo models + migrations (15 bảng)
- [x] Seed data (admin, venues, 5 events, seats, promo codes)
- [x] Auth backend: register, login, JWT HS256, refresh token rotation, Google OAuth (google-auth-library), CAPTCHA middleware, email verify, account lockout
- [x] Auth frontend: LoginPage, RegisterPage (Google button, validation real-time, password strength)
- [x] Redux store + RTK Query base (auto refresh 401 → re-auth)
- [x] Layouts (Main, Admin, Auth, Minimal), Header + Footer + Breadcrumb
- [x] Protected routes (AuthGuard, AdminGuard), lazy loading code split
- [x] Global error handler + API response format chuẩn
- [x] Socket.IO server + client setup
- [x] Email service (nodemailer + templates: welcome, verify-email, reset-password, booking-confirmed)

### Phase 2: Core Features (Ngày 4-8) ✅ COMPLETED

- [x] Events API: list, search, filter, detail, suggestions, trending, featured, seat-map, favorites
- [x] Landing page (ImmersiveHero + mesh gradient, TrendingEvents, UpcomingSales + countdown, HowItWorks)
- [x] Events page (autocomplete search, category chips, sort, glassmorphism cards, pagination)
- [x] Event detail page (hero banner, zone pricing, CTA sticky)
- [x] Admin: event CRUD wizard 5 bước + SeatMapBuilder (zone config, auto seat generation)
- [x] ★ Seat map interactive (SVG grid, keyboard a11y: arrows/enter/escape, aria-labels, color states)
- [x] ★ Lock seats API (pessimistic locking SELECT FOR UPDATE + transaction + edge cases)
- [x] Booking flow: chọn ghế → checkout → success page
- [x] Payment: VNPay sandbox + MoMo sandbox + simulated (giả lập) + callback handling
- [x] Countdown timer 10 phút (amber <2min, red+pulse <30s, auto-expire redirect)
- [x] Ticket + QR code (signed JWT) sau checkout
- [x] My Tickets page + QR display (modal overlay, QRCodeSVG)
- [x] Promo code: validate API + admin CRUD (PromoCode model)
- [x] Event favorites (toggle heart, API)
- [x] Notification system (DB + API + WebSocket push)
- [x] Admin venues CRUD
- [x] Admin dashboard (stats: revenue, users, bookings, active events)
- [x] Admin event management (table, publish/on_sale toggle)

### Phase 3: Real-time & Advanced (Ngày 9-12)

- [ ] Real-time seat map updates (WebSocket rooms — Socket.IO đã setup Phase 1)
- [ ] BullMQ jobs: release ghế, event transitions, email async, event reminder
- [ ] Virtual Queue (Redis sorted set, waiting room, auto-trigger)
- [ ] Admin dashboard: stats, revenue chart, seat fill, demographics, funnel, peak hours, sparklines
- [ ] Admin: user management, booking management, reports export
- [ ] Notification bell + dropdown (real-time push)
- [ ] Live activity feed (admin)

### Phase 4: Polish (Ngày 13-16)

- [ ] Responsive testing: tablet, mobile mọi page
- [ ] Mobile seat map: pinch zoom, pan, mini-map, bottom sheet
- [ ] Dark/Light mode
- [ ] Animations: page transitions, seat hover, countdown, toast, confetti
- [ ] Skeleton loading, empty states, error pages, offline indicator
- [ ] Input UX: autofill checkout, phone mask, currency format, date picker
- [ ] Static pages: About, FAQ, Terms, Privacy, Contact
- [ ] Profile: edit, change password, notification settings, booking history
- [ ] Accessibility: keyboard nav, ARIA, contrast check, skip nav, reduced motion
- [ ] URL rewriting, trailing slash, SEO meta
- [ ] Auto-save admin event draft
- [ ] Seed data đẹp (ảnh thật, tên event thật, nhiều zones)
- [ ] Test thủ công: concurrency, responsive, edge cases
- [ ] Data cleanup jobs (BullMQ scheduled: expired bookings, old tokens, old notifications)
- [ ] Unit tests (auth service, booking service, queue service, utils)
- [ ] Integration tests (auth flow, booking flow, concurrency, payment callbacks)
- [ ] CI pipeline (GitHub Actions: lint + test + build)
- [ ] Swagger API docs
- [ ] i18n (vi/en): react-i18next setup, translation files (8 namespaces), LanguageSwitcher, auto-detect browser lang, persist localStorage
- [ ] Fix bugs, polish UI

---

## 11. Mapping Tiêu chí chấm điểm

| # | Tiêu chí | Hệ số | Cover |
|---|----------|-------|-------|
| 1 | Chức năng & features | 0.35 | Auth (JWT+OAuth+CAPTCHA+email verify), Events CRUD+search+filter+favorites+remind, Seat map interactive, Booking flow+promo codes, Payment (VNPay+MoMo sandbox+simulated), Tickets QR+PDF download, Virtual Queue, Admin Dashboard+user mgmt+booking mgmt+reports+promo mgmt+venues+clone event, Notification system (in-app+email+WebSocket), Cookie consent, i18n vi/en |
| 2 | Thiết kế logic, dễ dùng | 0.10 | Booking flow tự nhiên, admin wizard, breadcrumb, edge case UX (return URL, duplicate prevention), accessibility (keyboard nav, screen reader) |
| 3 | Giao diện responsive, đẹp, bản sắc | 0.20 | Entertainment vibe, immersive hero, glassmorphism cards, ambient colors, Space Grotesk heading, gradient blobs+particles, responsive per-page (mobile-first), dark mode, Framer Motion animations, brand motifs (ticket-shaped, spotlight), DESIGN.md chi tiết |
| 4 | Hiệu năng (AJAX, JSON, DOM) | 0.10 | RTK Query (fetch+JSON+cache), SPA (no reload), lazy loading routes, code splitting admin/customer, WebSocket real-time, skeleton loading, debounce search, image lazy load |
| 5 | Phong cách lập trình | 0.05 | Feature-based modules, Controller-Service-Model, TypeScript strict, ESLint+Prettier, tách UI/logic (components vs hooks+services) |
| 6 | Xử lý nhập liệu | 0.05 | React Hook Form+Zod, autocomplete search, phone mask (0912 345 678), currency format (1.000.000₫), date picker, autofill checkout, auto-save draft, error messages tiếng Việt |
| 7 | An ninh | 0.05 | JWT+refresh rotation+revoke, OAuth2, argon2, Turnstile CAPTCHA, email verify, account lockout, rate limit chi tiết, DDoS protection (express-slow-down), IP blacklist, Helmet (CSP+HSTS), CORS strict, Zod validation, parameterized queries, QR signed JWT, cookie consent, request ID tracking, security audit logs |
| 8 | URL routing | 0.05 | React Router v7 nested+lazy, slug URLs (/events/:slug), backend redirect aliases (/su-kien→/events), trailing slash handling |
| 9 | ORM & DB independence | 0.05 | Sequelize ORM, migrations+seeders, associations in code, đổi MySQL→PostgreSQL bằng config |
