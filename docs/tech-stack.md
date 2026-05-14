# Tech Stack & Lý do chọn

> **Ticket Rush Docs** | [Tổng quan](plan.md) | **Tech Stack** | [Folder Structure](folder-structure.md) | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../DESIGN.md)

---

## 1. Tech Stack & Lý do chọn

### Frontend

| Library | Phiên bản | Vai trò | Lý do |
|---------|-----------|---------|-------|
| React | 19 | UI framework | Ecosystem lớn nhất, tài liệu phong phú |
| Vite | 6 | Build tool | HMR <50ms, tree-shaking, code splitting tự động |
| TypeScript | 5.x | Type safety | Bắt lỗi compile-time, IntelliSense tốt |
| TailwindCSS | 4 | Styling | Utility-first, responsive dễ, dark mode built-in |
| shadcn/ui | latest | Component library | Copy source vào project, customizable 100% |
| Redux Toolkit | latest | State management | RTK Query tích hợp sẵn cho API calls + caching |
| React Router | 7 | Routing | Nested routes, loaders, lazy loading built-in |
| Socket.IO Client | 4.x | WebSocket | Real-time seat map + notifications |
| Framer Motion | 11 | Animations | Declarative, layout transitions, AnimatePresence |
| React Hook Form | 7 | Form handling | Uncontrolled (performance), tích hợp Zod |
| Zod | 3 | Validation | Schema-first, shared với backend |
| Recharts | 2 | Charts | Responsive, dễ dùng, phù hợp dashboard |
| qrcode.react | 4 | QR Code | Render QR phía client |
| @react-oauth/google | latest | Google OAuth | Login bằng Google |
| @marsidev/react-turnstile | latest | CAPTCHA | Cloudflare Turnstile — miễn phí, privacy-friendly |
| lucide-react | latest | Icons | Consistent icon set, tree-shakable |
| @use-gesture/react | latest | Touch gestures | Pinch zoom, pan cho seat map mobile |
| vaul | latest | Drawer/Bottom sheet | Mobile-friendly drawer (shadcn ecosystem) |
| react-imask | latest | Input masking | Phone mask, date mask |
| embla-carousel-react | latest | Carousel | Lightweight, touch-friendly |
| sonner | latest | Toast notifications | Tích hợp shadcn/ui toast |
| react-to-print | latest | In vé | Print-friendly ticket view |
| js-cookie | latest | Cookie consent | Quản lý cookie preferences |
| react-i18next | latest | i18n framework | Đa ngôn ngữ React (vi/en) |
| i18next | latest | i18n core | Translation engine, interpolation, pluralization |
| i18next-browser-languagedetector | latest | Auto-detect lang | Detect từ browser/localStorage/URL |
| i18next-http-backend | latest | Lazy load translations | Load JSON translation files on-demand |

### Backend

| Library | Vai trò | Lý do |
|---------|---------|-------|
| Node.js 22 LTS | Runtime | JS cả stack, async I/O cho real-time |
| Express 5 | HTTP framework | Minimal, flexible, middleware ecosystem lớn |
| TypeScript | Type safety | Shared types với frontend |
| Sequelize 6 | ORM | MySQL, transaction + row locking, migration |
| MySQL 8 (XAMPP) | Database | ACID transactions, FULLTEXT search |
| Redis 7 (ioredis) | Cache + Queue | Session, virtual queue, rate limiting |
| Socket.IO 4 | WebSocket server | Rooms-based broadcast seat map + notifications |
| BullMQ | Job queue | Release ghế, email async, scheduled transitions |
| JSON Web Token | Authentication | Stateless auth, refresh rotation |
| Argon2 | Password hashing | OWASP recommended |
| Passport | OAuth strategy | Google OAuth2 integration |
| passport-google-oauth20 | Google OAuth | Strategy cho passport |
| Nodemailer | Email | Gửi email qua Gmail SMTP |
| Zod | Request validation | Shared schema với frontend |
| Helmet | Security headers | OWASP headers tự động |
| cors | CORS | Cho phép frontend origin |
| multer | File upload | Banner sự kiện (max 5MB, jpg/png/webp) |
| winston | Logging | Structured logging, multiple transports |
| csv-writer | Export CSV | Báo cáo admin |
| swagger-ui-express | API docs | Swagger UI tại /api-docs |
| swagger-jsdoc | API docs | Generate spec từ JSDoc comments |
| vnpay | VNPay integration | Thanh toán sandbox VNPay |
| axios | HTTP client | Gọi API MoMo sandbox |
| google-auth-library | Google token verify | Verify Google id_token server-side |
| qrcode | QR generation | Tạo QR code (backend) |
| pdfkit | PDF generation | Xuất vé PDF, báo cáo |
| morgan | HTTP logging | Request logging (kết hợp winston cho app logs) |
| compression | HTTP compression | Gzip response (giảm bandwidth) |
| cookie-parser | Cookie parsing | Đọc refresh token từ HttpOnly cookie |
| express-rate-limit | Rate limiting | Giới hạn request per IP/user |
| rate-limit-redis | Redis store cho rate limit | Shared state rate limit (multi-instance) |
| express-slow-down | DDoS protection | Delay tăng dần khi traffic cao |
