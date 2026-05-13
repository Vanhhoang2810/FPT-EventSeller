# TicketRush — Kế hoạch triển khai chi tiết

> Nền tảng đặt vé sự kiện online — entertainment-focused, chịu tải flash sale, real-time seat map.

> **TicketRush Docs** | **Tổng quan** | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../design.md)

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
| [Design](../design.md) | Design system chi tiết (file riêng) |

---

## 9. Design System (→ chi tiết trong `design.md`)

### 9.1 Visual Direction

**Vibe: Entertainment/Festival** — immersive, bold, dynamic. KHÔNG SaaS/corporate.

| Thuộc tính | Giá trị |
|------------|---------|
| Primary | Deep violet (#7C3AED → #6D28D9 gradient) |
| Accent | Coral (#F97316) — CTA, urgency |
| Success | Emerald (#10B981) |
| Warning | Amber (#F59E0B) |
| Error | Rose (#F43F5E) |
| Neutral | Zinc scale |
| Dark mode | Default (entertainment = dark) |
| Font heading | Space Grotesk (display, personality) |
| Font body | Inter |
| Icons | Lucide React (consistent, tree-shakable) |

### 9.2 Brand Identity

- **Logo:** "TicketRush" — chữ T+R liền, hiệu ứng tốc độ (speed lines)
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

### Phase 1: Foundation (Ngày 1-3)

- [ ] Init monorepo: Vite + React + TailwindCSS + shadcn/ui + Express + TypeScript
- [ ] ESLint, Prettier
- [ ] Sequelize + MySQL + Redis, tạo models + migrations (tất cả 15 bảng)
- [ ] Seed data (admin, venues, events, seats)
- [ ] Auth backend: register, login, JWT, refresh, Google OAuth, CAPTCHA, email verify
- [ ] Auth frontend: Login, Register (Google button, Turnstile, validation)
- [ ] Redux store + RTK Query base (auto refresh 401)
- [ ] Layouts (Main, Admin, Auth, Minimal), Header + Footer + Breadcrumb
- [ ] Protected routes (AuthGuard, AdminGuard), lazy loading
- [ ] Global error handler + API response format
- [ ] Socket.IO server + client setup (cần cho Phase 2 seat map + notifications)
- [ ] Email service (nodemailer + templates: welcome, verify, reset)

### Phase 2: Core Features (Ngày 4-8)

- [ ] Events API: list, search, filter, detail, suggestions, trending
- [ ] Landing page (Immersive Hero, Trending, Sắp mở bán, Categories)
- [ ] Events page (autocomplete search, filter, glassmorphism cards)
- [ ] Event detail page
- [ ] Admin: event CRUD wizard + seat map builder
- [ ] ★ Seat map interactive (SVG, keyboard a11y, aria-labels)
- [ ] ★ Lock seats API (pessimistic lock + transaction + edge cases)
- [ ] Booking flow: chọn ghế → checkout (VNPay/MoMo sandbox + giả lập) → xác nhận
- [ ] Payment integration: VNPay sandbox + MoMo sandbox + callback handling
- [ ] Countdown timer (10 phút, auto-expire redirect)
- [ ] Ticket + QR code (signed JWT) + PDF download sau checkout
- [ ] My Tickets page + QR display (animated overlay)
- [ ] Promo code: validate API + PromoCodeInput component + admin CRUD
- [ ] Event favorites (toggle, danh sách yêu thích)
- [ ] "Nhắc tôi" khi sắp mở bán (scheduled notification)
- [ ] Admin venues CRUD (cho event wizard Step 2)
- [ ] Notification system (DB + API + WebSocket + email templates)

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
| 3 | Giao diện responsive, đẹp, bản sắc | 0.20 | Entertainment vibe, immersive hero, glassmorphism cards, ambient colors, Space Grotesk heading, gradient blobs+particles, responsive per-page (mobile-first), dark mode, Framer Motion animations, brand motifs (ticket-shaped, spotlight), design.md chi tiết |
| 4 | Hiệu năng (AJAX, JSON, DOM) | 0.10 | RTK Query (fetch+JSON+cache), SPA (no reload), lazy loading routes, code splitting admin/customer, WebSocket real-time, skeleton loading, debounce search, image lazy load |
| 5 | Phong cách lập trình | 0.05 | Feature-based modules, Controller-Service-Model, TypeScript strict, ESLint+Prettier, tách UI/logic (components vs hooks+services) |
| 6 | Xử lý nhập liệu | 0.05 | React Hook Form+Zod, autocomplete search, phone mask (0912 345 678), currency format (1.000.000₫), date picker, autofill checkout, auto-save draft, error messages tiếng Việt |
| 7 | An ninh | 0.05 | JWT+refresh rotation+revoke, OAuth2, argon2, Turnstile CAPTCHA, email verify, account lockout, rate limit chi tiết, DDoS protection (express-slow-down), IP blacklist, Helmet (CSP+HSTS), CORS strict, Zod validation, parameterized queries, QR signed JWT, cookie consent, request ID tracking, security audit logs |
| 8 | URL routing | 0.05 | React Router v7 nested+lazy, slug URLs (/events/:slug), backend redirect aliases (/su-kien→/events), trailing slash handling |
| 9 | ORM & DB independence | 0.05 | Sequelize ORM, migrations+seeders, associations in code, đổi MySQL→PostgreSQL bằng config |
