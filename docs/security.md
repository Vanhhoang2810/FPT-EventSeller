# Routing & Security

> **TicketRush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | **Security** | [Setup](setup.md) | [Design](../design.md)

---

## 7. Routing

```typescript
// Lazy-loaded routes
const LandingPage = lazy(() => import('./features/landing/pages/LandingPage'));
const EventsPage = lazy(() => import('./features/events/pages/EventsPage'));
// ... tương tự cho tất cả pages

const routes = [
  // Public
  { path: '/', element: <LandingPage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '/events/:slug', element: <EventDetailPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/verify-email/:token', element: <EmailVerifyPage /> },
  { path: '/auth/google/callback', element: <OAuthCallbackPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/faq', element: <FAQPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/contact', element: <ContactPage /> },

  // Customer (auth required)
  { path: '/events/:id/seats', element: <AuthGuard><SeatSelectionPage /></AuthGuard> },
  { path: '/checkout/:bookingId', element: <AuthGuard><CheckoutPage /></AuthGuard> },
  { path: '/booking/:id/success', element: <AuthGuard><BookingSuccessPage /></AuthGuard> },
  { path: '/my-tickets', element: <AuthGuard><MyTicketsPage /></AuthGuard> },
  { path: '/my-tickets/:id', element: <AuthGuard><TicketDetailPage /></AuthGuard> },
  { path: '/profile', element: <AuthGuard><ProfilePage /></AuthGuard> },
  { path: '/favorites', element: <AuthGuard><FavoritesPage /></AuthGuard> },
  { path: '/queue/:eventId', element: <AuthGuard><WaitingRoomPage /></AuthGuard> },
  // VNPay: backend redirect thẳng → /booking/:id/success (không cần frontend route)
  { path: '/checkout/:bookingId/momo-return', element: <AuthGuard><CheckoutPage /></AuthGuard> },

  // Admin
  { path: '/admin', element: <AdminGuard><DashboardPage /></AdminGuard> },
  { path: '/admin/events', element: <AdminGuard><EventListPage /></AdminGuard> },
  { path: '/admin/events/new', element: <AdminGuard><EventCreatePage /></AdminGuard> },
  { path: '/admin/events/:id/edit', element: <AdminGuard><EventEditPage /></AdminGuard> },
  { path: '/admin/events/:id/seats', element: <AdminGuard><SeatMapSetupPage /></AdminGuard> },
  { path: '/admin/users', element: <AdminGuard><UserManagementPage /></AdminGuard> },
  { path: '/admin/bookings', element: <AdminGuard><BookingManagementPage /></AdminGuard> },
  { path: '/admin/reports', element: <AdminGuard><ReportsPage /></AdminGuard> },
  { path: '/admin/promo-codes', element: <AdminGuard><PromoManagementPage /></AdminGuard> },
  { path: '/admin/venues', element: <AdminGuard><VenueManagementPage /></AdminGuard> },
  { path: '/admin/audit-logs', element: <AdminGuard><AuditLogsPage /></AdminGuard> },

  // Error
  { path: '*', element: <NotFound /> },
];
```

**Backend URL rewriting:** Express middleware redirect trailing slash (`/events/` → `/events`). Route aliases: `/su-kien` → 301 redirect `/events`.

---

## 8. Security

### 8.1 Authentication Flow

```
1. POST /login (+ CAPTCHA) → verify password + check lockout → trả { accessToken }
   + set refreshToken trong HttpOnly cookie + lưu hash vào DB (refresh_tokens)
2. Client lưu accessToken trong Redux store (memory)
3. Mỗi request: Authorization: Bearer <accessToken>
4. 401 → auto gọi POST /refresh → accessToken mới
5. Refresh fail → redirect /login?returnUrl=currentPath
```

### 8.2 OAuth2 Flow

```
1. Client: click Google button → Google popup → nhận id_token
2. POST /api/auth/google { googleIdToken }
3. Server: google-auth-library verify → tìm user by google_id
   → Có: login → trả JWT
   → Chưa: tạo user mới (email_verified=true) → trả JWT
```

### 8.3 Checklist bảo mật

| Yêu cầu | Giải pháp |
|----------|-----------|
| Password | argon2id, min 8 ký tự, ít nhất 1 chữ hoa + 1 số |
| JWT | HS256 (symmetric secret), access 15 phút, refresh 7 ngày rotation, lưu DB để revoke |
| OAuth | Google OAuth2 (google-auth-library verify id_token) |
| CAPTCHA | Cloudflare Turnstile (register, login, forgot-password) |
| Email verify | Token 24h TTL, chưa verify → không mua vé |
| Account lockout | 5 lần sai → khóa 15 phút, thông báo qua email |
| CORS | Chỉ CLIENT_URL, không wildcard |
| Helmet | CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| Rate limiting | express-rate-limit + Redis store (chi tiết bảng bên dưới) |
| DDoS | express-slow-down (delay tăng dần), request size limit 10MB, Cloudflare proxy (production) |
| Bot detection | Turnstile CAPTCHA + rate limit + User-Agent analysis |
| IP blacklist | Redis set, middleware check, admin có thể thêm/xóa IP |
| Input validation | Zod schema mọi request body + query params |
| SQL injection | Sequelize parameterized (không raw concat) |
| XSS | React auto-escape, CSP header, không dangerouslySetInnerHTML |
| CSRF | SameSite=Strict cookie, Origin/Referer check |
| QR forgery | Signed JWT + anti-reuse (used_at) + animated overlay |
| File upload | multer: 5MB max, jpg/png/webp only, virus scan nếu cần |
| HTTPS | Enforce HTTPS redirect (production) |
| Cookie | HttpOnly, Secure, SameSite=Strict |
| Request ID | UUID per request (X-Request-ID header), log tracking |
| Security logging | Log failed logins, suspicious activity → audit_logs |
| Session mgmt | Xem active sessions (refresh_tokens), revoke individual session |
| Promo abuse | Per-user limit, total limit, validate trước checkout |
| Dependency | npm audit, Dependabot alerts |

### 8.4 Rate Limiting chi tiết

| Endpoint | Window | Max requests | Hành động khi vượt |
|----------|--------|-------------|---------------------|
| POST /register | 1 giờ per IP | 3 | 429 + "Thử lại sau" |
| POST /login | 1 phút per email | 5 | 429 + trigger lockout nếu sai |
| POST /forgot-password | 1 giờ per email | 3 | 429 |
| POST /lock-seats | 1 phút per user | 10 | 429 + "Bạn đang thao tác quá nhanh" |
| POST /promo/validate | 1 phút per user | 20 | 429 |
| General API (auth) | 1 phút per user | 100 | 429 |
| General API (no auth) | 1 phút per IP | 60 | 429 |
| WebSocket connections | per IP | 10 concurrent | Reject connection |

### 8.5 DDoS Protection

```typescript
// middleware/security.ts
import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Delay tăng dần sau 50 requests/phút
const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => (hits - 50) * 100, // 100ms, 200ms, 300ms...
  maxDelayMs: 5000
});

// Request size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cho production: đặt sau Cloudflare → trust proxy
app.set('trust proxy', 1);
```

### 8.6 Cookie Consent

- Banner "Chúng tôi sử dụng cookie..." với nút "Chấp nhận" / "Tùy chỉnh"
- Lưu preference vào localStorage + cookie `cookie_consent=accepted`
- Chỉ set non-essential cookies (analytics) sau khi user consent
- Component: `shared/components/CookieConsent.tsx`
