# Ticket Rush UI/UX Audit & Redesign Roadmap

---

# Tóm tắt trạng thái tổng quan

| Phase | Tên | Trạng thái |
|---|---|---|
| 1 | Global Audit & UI Inventory | ✅ DONE |
| 2 | Design System Foundation | ✅ DONE |
| 3 | Dark Mode / Light Mode | ✅ DONE |
| 4 | Internationalization (EN/VI) | ✅ DONE |
| 5 | Layout & Navigation | ✅ DONE |
| 6 | Component System Refactor | ✅ DONE |
| 7 | Motion & Effects | ✅ DONE |
| 8 | Frontend Page Redesign | ✅ DONE |
| 9 | Admin Dashboard Redesign | ✅ DONE |
| 10 | Responsive & Device QA | ✅ DONE |
| 11 | Micro-level UI Polish | ✅ DONE |
| 12 | SEO & Technical SEO | ✅ DONE |
| 13 | Final Cross-check & Consistency QA | ✅ DONE |

---

# Phase 1 — Global Audit & UI Inventory ✅

- Xóa duplicate `src/components/ui/` (8 files) + `src/hooks/useSocket.ts`
- Fix `useSocket` bug (trả về ref thay vì `.current`) → hết Header crash
- Xóa `App.css` orphan, dead route `ADMIN_SEAT_MAP`
- Full inventory: 25 customer pages + 10 admin pages + 4 layouts

---

# Phase 2 — Design System Foundation ✅

- Migrate toàn bộ hardcoded zinc/emerald/white → design tokens (500+ replacements)
- `CATEGORY_ICONS`: emoji → Lucide components
- `globals.css`: `.glass` → `color-mix()`, scrollbar → CSS vars, skeleton → CSS vars
- Animation timing tokens: `--duration-instant/fast/base/slow/slower`, `--ease-*`
- 0 hardcoded color còn sót

---

# Phase 3 — Dark Mode / Light Mode ✅

- `:root` (dark) + `.light` CSS vars đầy đủ
- Theme toggle trong Header (customer) và AdminLayout (admin)
- Admin sidebar cố định dark (intentional SaaS convention)
- `storageKey="ticketrush-theme"` đúng

**Known limitation:** Recharts chart colors hardcode dark values (SVG không resolve CSS vars — kỹ thuật limitation)

---

# Phase 4 — Internationalization (EN/VI) ✅

- 25+ customer pages + 10 admin pages + auth + static → `useTranslation()`
- `CATEGORY_LABELS` → `t('categories.x')`, `EVENT_STATUS_LABELS` → `t('status.x')`
- Admin: "Dashboard" → "Bảng điều khiển", "Audit Logs" → "Nhật ký thao tác", "Conversion Funnel" → "Phễu chuyển đổi"
- Landing components (ImmersiveHero, TrendingEvents, UpcomingSales, HowItWorks) → i18n
- Funnel stage labels → `t('dashboard.funnel.stages.N')` (index-based, bypass API Vietnamese strings)
- LanguageSwitcher trong Header drawer + AdminLayout header
- EventCreatePage/EditPage wizard form fields → `t('wizardForm.*')`
- "FAQ" → "Hỏi đáp" trong vi locale

---

# Phase 5 — Layout & Navigation ✅

- Desktop nav: active state, Lucide icons
- Mobile drawer: logo, nav links với icons, LanguageSwitcher, theme toggle, auth — portal fix (backdrop-blur bug)
- Hamburger → bên phải, drawer → mở từ bên phải
- AdminLayout: theme toggle, language switcher
- HowItWorks: equal heights, arrow alignment

---

# Phase 6 — Component System ✅

### Components tạo mới

| Component | Path |
|---|---|
| `Accordion` | `src/shared/components/ui/accordion.tsx` |
| `Tabs` | `src/shared/components/ui/tabs.tsx` |
| `Tooltip` | `src/shared/components/ui/tooltip.tsx` |
| `Skeleton` / `SkeletonText` / `SkeletonCard` | `src/shared/components/ui/skeleton.tsx` |
| `Drawer` | `src/shared/components/ui/drawer.tsx` |
| `EmptyState` | `src/shared/components/EmptyState.tsx` |
| `ErrorState` | `src/shared/components/ErrorState.tsx` |

### Integrations

- `FAQPage` → dùng `Accordion` component
- `ProfilePage` → dùng `Tabs` component
- `MyTicketsPage` + `FavoritesPage` → dùng `EmptyState` component

---

# Phase 7 — Motion & Effects ✅

- Framer Motion page transitions (MainLayout)
- CSS animations: meshShift, gradientShift, shimmer
- `prefers-reduced-motion` media query
- Animation timing tokens trong globals.css
- `transition-colors` consistent trên toàn bộ interactive elements

---

# Phase 8 — Frontend Page Redesign ✅

- `DOMPurify.sanitize()` cho `dangerouslySetInnerHTML` trong EventDetailPage (XSS fix)
- Error states: `BookingSuccessPage`, `MyTicketsPage` (isError handling)
- SeatSelectionPage: floating CTA bar mobile + `pb-20` padding bottom
- EventDetailPage hero overlay: `from-black/90` (readable in both themes)
- Auth button colors: `bg-primary-600` thay vì orange accent gradient
- Login/Register form: consistent với design system

---

# Phase 9 — Admin Dashboard Redesign ✅

- Toàn bộ admin pages: hardcoded colors → tokens, i18n
- StatCard, AdminPagination: tokens
- AdminLayout: theme toggle, language switcher, i18n breadcrumb
- Admin tables: `overflow-x-auto` cho mobile scroll

---

# Phase 10 — Responsive & Device QA ✅

- SeatSelectionPage: floating CTA bar + `pb-20 lg:pb-0`
- EventDetailPage: `md:sticky md:top-24` (từ lg → md)
- MyTicketsPage: `grid-cols-1 sm:grid-cols-2`
- Header mobile: hamburger phải, drawer phải, portal fix
- Admin tables: `overflow-x-auto`

---

# Phase 11 — Micro-level UI Polish ✅

- `transition-colors` consistent trên pagination, nav links, buttons
- Footer: `bg-background` thay vì hardcoded `dark:bg-[#050507]`
- Icon consistency: emoji → Lucide toàn bộ codebase
- HowItWorks: equal height steps, arrow alignment
- Brand "Ticket Rush": space consistent
- Toast: compact, close button bên phải
- Mobile drawer: contrast cải thiện (`bg-card`, `text-foreground/70`)
- Login/Register button: primary green thay vì orange gradient

---

# Phase 12 — SEO ✅

- `usePageMeta` hook: dynamic title + meta cho tất cả pages
- `public/robots.txt`
- `public/sitemap.xml` (7 static routes)
- `public/og-image.svg` (1200×630, brand colors)
- `og:image`, `og:title`, `og:description` trong index.html
- Skip navigation link với inline CSS (no FOUC)

---

# Phase 13 — Final Cross-check ✅

### Build status
- TypeScript: 0 errors
- Vite build: ✅ pass
- Chunk splitting: vendors phân tách (react/redux/charts/router/i18n/forms/ui)
- Main bundle: 61 kB (giảm từ 505 kB)

### Verified
- Dark/light mode: ✅ CSS vars switch, all hardcoded removed
- EN/VI: ✅ tất cả pages dùng `t()`, CATEGORY_LABELS → i18n, funnel stages → i18n
- Responsive: ✅ mobile header, floating CTAs, sticky cards
- Icon consistency: ✅ Lucide icons toàn bộ (0 emoji trong UI)
- Accessibility: skip nav, aria-labels, focus-visible
- XSS: DOMPurify cho dangerouslySetInnerHTML

---

# Technical Debt còn lại (low priority)

| Item | File | Note |
|---|---|---|
| Recharts không theme-aware | DashboardPage, ReportsPage | SVG limitation — chart colors hardcode dark |
| og:image là SVG | public/og-image.svg | Facebook/Twitter prefer PNG — upgrade khi có design asset |
| Sitemap dynamic | public/sitemap.xml | Chỉ có static routes — event pages cần server-side sitemap |
| Cloudflare test key | .env | Warning text "Chỉ để kiểm tra..." biến mất khi dùng production key |
| ProfilePage notification API | ProfilePage.tsx | `/api/users/notification-settings` endpoint cần implement ở backend |
