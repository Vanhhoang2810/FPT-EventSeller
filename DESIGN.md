# TicketRush — Design System

> Entertainment/Festival vibe. Immersive, bold, dynamic. KHÔNG SaaS/corporate.

---

## 1. Brand Identity

### 1.1 Personality

| Thuộc tính | Mô tả |
|------------|-------|
| Tone | Năng lượng, hào hứng, hiện đại |
| Feel | Đang ở concert / festival — ánh đèn, âm nhạc, đám đông |
| Target | Gen Z + Millennials (18-35), Việt Nam |
| Differentiator | Tốc độ (Rush) + trực quan (seat map real-time) |

### 1.2 Logo

- **Wordmark:** "TicketRush" — font Space Grotesk Bold
- **Icon mark:** Chữ "T" + "R" liền nhau, cắt góc tạo hiệu ứng tốc độ (speed lines phía sau)
- **Usage:** Logo luôn trên nền tối. Minimum size 120px width
- **Favicon:** Biểu tượng vé cách điệu (hình chữ nhật bo góc + đường cắt ngang)

### 1.3 Visual Motifs

- **Ticket-shaped elements:** Card corners cắt góc, dividers dạng perforation (nét đứt)
- **Stage/spotlight:** Gradient radial phía trên hero section — như spotlight rọi từ sân khấu
- **Speed lines:** Diagonal lines mỏng ở background — gợi "rush", tốc độ
- **Dot matrix:** Grid dots mờ ở background — liên tưởng LED wall sân khấu

---

## 2. Color System

### 2.1 Core Palette

```css
/* Primary — Emerald (sang trọng, exclusive, high-end) */
--primary-50:  #ECFDF5;
--primary-100: #D1FAE5;
--primary-200: #A7F3D0;
--primary-300: #6EE7B7;
--primary-400: #34D399;
--primary-500: #10B981;
--primary-600: #059669;  /* ← Main */
--primary-700: #047857;
--primary-800: #065F46;
--primary-900: #064E3B;

/* Accent — Coral/Orange (CTA, urgency) */
--accent-50:  #FFF7ED;
--accent-100: #FFEDD5;
--accent-400: #FB923C;
--accent-500: #F97316;  /* ← Main */
--accent-600: #EA580C;

/* Semantic */
--success: #14B8A6;  /* Teal — thanh toán thành công (phân biệt với primary emerald) */
--warning: #F59E0B;  /* Amber — ghế locked, sắp hết hạn */
--error:   #F43F5E;  /* Rose — lỗi, hết hạn, countdown <30s */
--info:    #3B82F6;  /* Blue — thông tin, tooltip */
```

### 2.2 Dark Mode (default)

```css
--bg-primary:    #09090B;  /* zinc-950 */
--bg-secondary:  #18181B;  /* zinc-900 */
--bg-tertiary:   #27272A;  /* zinc-800 */
--bg-elevated:   #3F3F46;  /* zinc-700 */
--text-primary:  #FAFAFA;  /* zinc-50 */
--text-secondary:#A1A1AA;  /* zinc-400 */
--text-muted:    #71717A;  /* zinc-500 */
--border:        #3F3F46;  /* zinc-700 */
```

### 2.3 Light Mode

```css
--bg-primary:    #FFFFFF;
--bg-secondary:  #F4F4F5;  /* zinc-100 */
--bg-tertiary:   #E4E4E7;  /* zinc-200 */
--bg-elevated:   #FFFFFF;
--text-primary:  #18181B;  /* zinc-900 */
--text-secondary:#52525B;  /* zinc-600 */
--text-muted:    #71717A;  /* zinc-500 */
--border:        #D4D4D8;  /* zinc-300 */

/* Light mode shadows */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 6px rgba(0,0,0,0.07);
--shadow-lg:  0 10px 15px rgba(0,0,0,0.1);
--shadow-glow: 0 0 20px rgba(5,150,105,0.15);

/* Light mode semantic — giảm saturation cho dễ đọc */
--success-light: #059669;
--warning-light: #D97706;
--error-light:   #E11D48;
--info-light:    #2563EB;
```

### 2.4 Glassmorphism

```css
/* Dùng cho event card overlay, modal backdrop, hero text overlay */
.glass {
  background: rgba(9, 9, 11, 0.6);       /* dark mode */
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.glass-light {
  background: rgba(255, 255, 255, 0.7);  /* light mode */
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
```

### 2.5 Noise/Grain Texture

```css
/* Áp dụng lên background sections để tạo depth */
.noise {
  position: relative;
}
.noise::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* inline SVG noise */
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

### 2.6 Mesh Gradient Background

```css
/* Hero section, landing page background */
.mesh-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(5,150,105,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.08) 0%, transparent 50%),
    var(--bg-primary);
  /* Animated: positions drift slowly */
  animation: meshShift 20s ease-in-out infinite alternate;
}
@keyframes meshShift {
  0% { background-position: 0% 0%, 100% 0%, 50% 100%; }
  100% { background-position: 30% 20%, 70% 40%, 40% 60%; }
}
```

### 2.7 Seat Map Colors

| Trạng thái | Dark mode | Light mode | Icon/Pattern |
|-----------|-----------|------------|--------------|
| Available | `#059669` (emerald-600) | `#047857` | Hình tròn rỗng |
| Selected (bạn) | `#F97316` (orange-500) | `#EA580C` | Hình tròn đầy + check |
| Locked (người khác) | `#F59E0B` (amber) | `#D97706` | Hình tròn + khóa |
| Sold | `#52525B` (zinc-600) | `#A1A1AA` | Hình tròn + X |
| Disabled | `#3F3F46` (zinc-700) | `#D4D4D8` | Hình tròn nét đứt |

> Phân biệt trạng thái bằng **icon + pattern**, không chỉ màu (accessibility).

---

## 3. Typography

### 3.1 Font Stack

```css
--font-heading: 'Space Grotesk', sans-serif;  /* Display — personality */
--font-body: 'Inter', sans-serif;              /* Body — readability */
--font-mono: 'JetBrains Mono', monospace;      /* Code, countdown */
```

### 3.2 Scale

| Level | Font | Size | Weight | Line height | Usage |
|-------|------|------|--------|-------------|-------|
| h1 | Space Grotesk | 48px / 3rem | 700 | 1.1 | Landing hero, page title |
| h2 | Space Grotesk | 36px / 2.25rem | 700 | 1.2 | Section title |
| h3 | Space Grotesk | 24px / 1.5rem | 600 | 1.3 | Card title, modal title |
| h4 | Inter | 20px / 1.25rem | 600 | 1.4 | Subsection |
| body-lg | Inter | 18px / 1.125rem | 400 | 1.6 | Event description |
| body | Inter | 16px / 1rem | 400 | 1.5 | Default text |
| body-sm | Inter | 14px / 0.875rem | 400 | 1.5 | Helper text, labels |
| caption | Inter | 12px / 0.75rem | 500 | 1.4 | Badges, timestamps |
| countdown | JetBrains Mono | 32px / 2rem | 700 | 1 | Countdown timer digits |

### 3.3 Responsive Typography (CSS clamp — fluid scaling)

```css
/* Thay vì breakpoint fixed, dùng clamp cho smooth scaling */
h1 { font-size: clamp(2rem, 5vw, 3rem); }       /* 32px → 48px */
h2 { font-size: clamp(1.5rem, 3.5vw, 2.25rem); } /* 24px → 36px */
h3 { font-size: clamp(1.25rem, 2.5vw, 1.5rem); } /* 20px → 24px */
body { font-size: clamp(0.875rem, 1.5vw, 1rem); } /* 14px → 16px */
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (Tailwind)

`4px` (1) → `8px` (2) → `12px` (3) → `16px` (4) → `20px` (5) → `24px` (6) → `32px` (8) → `48px` (12) → `64px` (16) → `96px` (24)

### 4.2 Grid

- **Page max-width:** 1280px (xl breakpoint), centered
- **Grid columns:** 12-col (desktop), 8-col (tablet), 4-col (mobile)
- **Gutter:** 24px (desktop), 16px (mobile)
- **Section spacing:** 96px (desktop), 64px (mobile)

### 4.3 Border Radius

| Element | Radius |
|---------|--------|
| Button | 8px (rounded-lg) |
| Card | 12px (rounded-xl) |
| Input | 8px |
| Modal | 16px (rounded-2xl) |
| Badge | 9999px (rounded-full) |
| Avatar | 9999px |
| Seat cell | 6px |

### 4.4 Shadows (Dark mode)

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
--shadow-md:  0 4px 6px rgba(0,0,0,0.4);
--shadow-lg:  0 10px 15px rgba(0,0,0,0.5);
--shadow-glow: 0 0 20px rgba(5,150,105,0.3);  /* Violet glow cho cards hover */
```

---

## 5. Component Specs

### 5.1 Button

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | emerald-600 | white | none | emerald-700 + shadow-glow |
| Secondary | zinc-800 | zinc-100 | zinc-700 | zinc-700 |
| Accent | gradient orange-500→red-500 | white | none | opacity 90% + shadow |
| Ghost | transparent | zinc-300 | none | zinc-800 |
| Destructive | rose-600 | white | none | rose-700 |

Sizes: `sm` (h-8, text-sm), `md` (h-10, text-sm), `lg` (h-12, text-base), `xl` (h-14, text-lg — CTA)

### 5.2 Card

```
┌──────────────────────────┐
│  ┌────────────────────┐  │  ← Ảnh event (aspect 16:9)
│  │    EVENT IMAGE      │  │     hover: scale 1.05, transition 300ms
│  │                     │  │     glassmorphism overlay phía dưới
│  │  ┌─────────────┐   │  │
│  │  │ Badge: HOT  │   │  │  ← Badge góc trên phải
│  │  └─────────────┘   │  │
│  └────────────────────┘  │
│  Tên sự kiện              │  ← h3, Space Grotesk, 1 dòng truncate
│  📅 15/06/2026 • 20:00   │  ← body-sm, zinc-400
│  📍 Nhà hát Lớn, Hà Nội  │  ← body-sm, zinc-400
│  Từ 500.000₫              │  ← body, emerald-400, font-semibold
└──────────────────────────┘
   border: 1px zinc-800
   bg: zinc-900
   hover: border-emerald-600 + shadow-glow
   border-radius: 12px
```

### 5.3 Input

- Height: 40px (md), 48px (lg)
- Border: 1px zinc-700, focus: emerald-500 + ring-2 emerald-500/20
- Placeholder: zinc-500
- Error state: border rose-500, message rose-400 bên dưới
- Disabled: opacity 50%

### 5.4 Modal/Dialog

- Overlay: bg-black/60, backdrop-blur-sm
- Content: bg-zinc-900, border zinc-800, rounded-2xl, max-w-lg
- Header: h3 + close button
- Footer: buttons align-right
- Mobile: full-width bottom sheet (vaul)

### 5.5 Table (Admin)

- Header: bg-zinc-800, text-zinc-400 uppercase text-xs
- Row: bg-zinc-900, hover bg-zinc-800, border-b zinc-800
- Striped: không (hover đủ rồi)
- Sticky header khi scroll
- Mobile: horizontal scroll hoặc card layout

### 5.6 Badge

| Type | Background | Text |
|------|-----------|------|
| Hot | gradient orange→red | white |
| Mới | emerald-600 | white |
| Sắp hết | amber-500/20 | amber-400 |
| Đã kết thúc | zinc-700 | zinc-400 |
| Sold out | rose-500/20 | rose-400 |
| Active | emerald-500/20 | emerald-400 |

Padding: `px-2.5 py-0.5`, font: caption (12px), rounded-full.

### 5.7 Toast (Sonner)

- Position: top-right (desktop), top-center (mobile)
- Success: border-emerald-500/30, icon emerald
- Error: border-rose-500/30, icon rose
- Info: border-blue-500/30, icon blue
- Auto-dismiss: 4 giây
- Swipe to dismiss trên mobile

### 5.8 Tooltip

- bg-zinc-800, border-emerald-500/30, text-sm, rounded-lg, shadow-lg
- Arrow: 6px triangle matching bg
- Delay: 300ms show, 100ms hide
- Mobile: long-press trigger (thay hover)

### 5.9 Tabs

- Inactive: text-zinc-400, bg transparent
- Active: text-white, border-b-2 emerald-500
- Hover: text-zinc-200
- Variant underline (default) + variant pills (bg-zinc-800 active)
- Mobile: horizontal scroll, no wrap

### 5.10 Sidebar (Admin)

- Width: 240px (desktop), collapsed 64px (icons only), hidden (mobile → bottom nav)
- bg-zinc-950, border-r zinc-800
- Item: h-10, px-3, rounded-lg, text-zinc-400
- Item active: bg-emerald-600/10, text-emerald-400, border-l-2 emerald-500
- Item hover: bg-zinc-800, text-zinc-200
- Logo top, user avatar + name bottom
- Collapse toggle button

### 5.11 Avatar

- Sizes: `xs` (24px), `sm` (32px), `md` (40px), `lg` (48px), `xl` (64px)
- Border-radius: rounded-full
- Fallback: initials (bg-emerald-600, text-white, font-semibold)
- Online indicator: emerald dot bottom-right, border-2 bg-primary
- Upload overlay: hover → dark overlay + camera icon

### 5.12 Progress Bar

- Height: 4px (slim), 8px (default), 12px (thick)
- Track: bg-zinc-800
- Fill: gradient emerald-600→emerald-400, animated shimmer
- Percentage label: text-xs, right-aligned
- Queue progress: dùng variant thick + percentage

### 5.13 Countdown Timer

```
┌──────────────────────────┐
│   09 : 45               │  ← JetBrains Mono, 32px, white
│   phút   giây            │  ← caption, zinc-400
└──────────────────────────┘
```
- bg-zinc-900, border zinc-800, rounded-xl, p-4
- Normal: text-white
- Warning (<2 phút): text-amber-400, border-amber-500/30
- Critical (<30s): text-rose-400, border-rose-500/30, digit flash animation
- Digit flip: mỗi giây, number transitions bằng slide-down

### 5.14 Notification Dropdown

- Trigger: bell icon (Lucide `Bell`) + unread count badge (rose-500, absolute top-right)
- Dropdown: w-80, max-h-96 scroll, bg-zinc-900, border zinc-800, rounded-xl, shadow-lg
- Item: hover bg-zinc-800, p-3, border-b zinc-800
- Unread item: border-l-2 emerald-500
- Item structure: icon (left) + title bold + message truncate + time relative (caption)
- Footer: "Đánh dấu tất cả đã đọc" link
- Empty: "Không có thông báo mới" + illustration

### 5.15 Cookie Consent Banner

- Position: bottom, full-width, z-50
- bg-zinc-900/95, backdrop-blur-md, border-t zinc-800
- Content: text-sm + "Chấp nhận" button (primary) + "Tùy chỉnh" link
- Mobile: stack layout
- Slide up animation (300ms)

---

## 6. Animation Catalog

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page enter | Fade in + slide up 20px | 300ms | ease-out |
| Page exit | Fade out | 200ms | ease-in |
| Card hover | Scale 1.02 + shadow-glow | 200ms | ease |
| Card image hover | Scale 1.05 (overflow hidden) | 300ms | ease |
| Seat hover | Scale 1.15 + subtle glow | 150ms | ease |
| Seat select | Pulse (scale 1→1.2→1) | 300ms | spring |
| Seat status change | Color crossfade | 300ms | ease |
| Button click | Scale 0.97→1 | 100ms | ease |
| Countdown digit | Flip animation | 300ms | ease-out |
| Countdown <30s | Red flash (opacity 0.5→1) | 500ms | loop |
| Toast enter | Slide in from right 100% | 300ms | spring |
| Skeleton | Shimmer (bg gradient sweep) | 1.5s | linear, loop |
| Queue wait | Floating particles upward | continuous | linear |
| Booking success | Checkmark draw + confetti burst | 800ms | spring |
| Modal enter | Fade + scale 0.95→1 | 200ms | spring |
| Bottom sheet | Slide up from bottom | 300ms | spring(damping:25) |
| Hero parallax | translateY: scroll * 0.3 | per frame | linear |

| Scroll reveal | Fade in + slide up 30px khi enter viewport | 500ms | ease-out |
| Stagger children | Cards lần lượt reveal (delay 50ms mỗi item) | 300ms+stagger | ease-out |
| Counter animate | Số chạy từ 0 → value (stats cards) | 1000ms | ease-out |
| Progress fill | Width 0→n% (queue, stats) | 800ms | ease-out |
| Theme switch | Color crossfade toàn trang | 200ms | ease |

**Scroll-triggered:** Dùng Framer Motion `whileInView` + `viewport={{ once: true, margin: "-100px" }}`. Mỗi section landing page reveal khi scroll tới.

**`prefers-reduced-motion`:** Tắt TẤT CẢ animation trên. Chuyển về instant transitions (opacity 0→1, 0ms).

---

## 7. Seat Map Visual Design

### 7.1 Layout

```
┌─── Stage (gradient bar, "SÂN KHẤU" text) ───┐
│                                                │
│  ┌─ Zone VIP ──────────────────────────────┐  │
│  │  A1  A2  A3  A4  A5  ...  A15          │  │  ← Mỗi ô 32x32px (desktop)
│  │  B1  B2  B3  B4  B5  ...  B15          │  │     24x24px (mobile)
│  │  ...                                    │  │     gap: 4px
│  └─────────────────────────────────────────┘  │
│                 (gap 24px)                     │
│  ┌─ Zone Regular ──────────────────────────┐  │
│  │  ...                                    │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─ Legend ─────────────────────────────────┐  │
│  │ 🟢 Trống  🟣 Đang chọn  🟡 Giữ chỗ    │  │
│  │ ⚫ Đã bán  ⬛ Không khả dụng            │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### 7.2 Seat Cell States

```css
/* Available */
.seat-available {
  background: var(--success);
  border-radius: 6px;
  cursor: pointer;
  transition: transform 150ms, box-shadow 150ms;
}
.seat-available:hover {
  transform: scale(1.15);
  box-shadow: 0 0 8px var(--success);
}

/* Selected */
.seat-selected {
  background: var(--primary-500);
  box-shadow: 0 0 12px var(--primary-500);
  animation: pulse 300ms ease;
}

/* Locked (người khác) */
.seat-locked {
  background: var(--warning);
  opacity: 0.7;
  cursor: not-allowed;
}

/* Sold */
.seat-sold {
  background: #52525B; /* zinc-600 — khớp với Section 2.7 table */
  opacity: 0.4;
  cursor: not-allowed;
}

/* Disabled */
.seat-disabled {
  background: var(--bg-elevated); /* zinc-700 dark, zinc-200 light */
  border: 1px dashed var(--border);
  opacity: 0.3;
  cursor: not-allowed;
}

/* Focus state (keyboard navigation) */
.seat:focus-visible {
  outline: 2px solid var(--primary-400);
  outline-offset: 2px;
}
```

### 7.3 Mobile Seat Map

- Fullscreen mode (ẩn header)
- **Pinch to zoom:** min 0.5x, max 3x
- **Pan:** drag to move
- **Mini-map:** góc phải dưới, 80x60px, hiện viewport rectangle
- **Bottom sheet:** danh sách ghế đã chọn + tổng tiền + nút "Tiếp tục"
- Touch target cho mỗi ghế: min 44x44px (padding nếu ghế nhỏ hơn)

---

## 8. Admin Dashboard Chart Styles

### 8.1 Chung

- Background: zinc-900, border zinc-800, rounded-xl
- Title: h4 góc trên trái
- Legend: dưới chart, text-xs, zinc-400
- Tooltip: bg-zinc-800, border-emerald-500, rounded-lg, text-sm
- Grid lines: zinc-800, dashed

### 8.2 Revenue Chart (Line)

- Line: gradient emerald-500 → emerald-300, strokeWidth 2
- Area fill: emerald-500/10
- Dots: emerald-500, r=4, hover r=6
- X-axis: ngày/tuần/tháng labels
- Y-axis: formatted VND (1M, 5M, 10M)

### 8.3 Seat Fill (Bar)

- Bars: gradient emerald-600 → emerald-400
- Hover: orange-500
- Labels: event name (truncate), percentage

### 8.4 Demographics (Pie + Bar)

- Pie: emerald-500 (male), orange-400 (female), zinc-500 (other)
- Bar: horizontal, grouped by age range (18-24, 25-34, 35-44, 45+)
- Colors: violet scale (400→700)

### 8.5 Conversion Funnel

- Stages: View → Select seat → Lock → Checkout → Confirm
- Funnel shape: trapezoid bars, decreasing width
- Colors: emerald-300 → emerald-700 gradient per stage
- Labels: count + percentage of previous

### 8.6 Stats Cards

```
┌──────────────────────┐
│ 📊 Doanh thu hôm nay │  ← caption, zinc-400
│ 12.500.000₫          │  ← h3, white
│ ▲ 15% so với hôm qua │  ← caption, emerald-400
│ ~~~~~~~~ (sparkline)  │  ← mini line chart 60x20px, emerald-400
└──────────────────────┘
  bg: zinc-900, border zinc-800
  hover: border-emerald-600
```

---

## 9. Responsive Behavior

### 9.1 Breakpoints

| Name | Width | Columns | Gutter |
|------|-------|---------|--------|
| Mobile | <640px | 4 | 16px |
| sm | 640px | 8 | 16px |
| md | 768px | 8 | 24px |
| lg | 1024px | 12 | 24px |
| xl | 1280px | 12 | 24px |

### 9.2 Navigation

- **Desktop:** Header (logo, nav links, search, notification bell, user avatar dropdown)
- **Tablet:** Header (logo, hamburger → slide-out nav, notification, avatar)
- **Mobile:** Header (logo, notification) + bottom tab bar (Home, Events, Tickets, Profile)
- **Admin desktop:** Sidebar (240px) + header
- **Admin mobile:** Bottom nav (Dashboard, Events, Users, More)

### 9.3 Component Behavior

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Event card | Fixed width in grid | Full width |
| Filter | Sidebar | Bottom sheet (vaul) |
| Seat map | Full + sidebar | Fullscreen + bottom sheet |
| Admin table | Full table | Horizontal scroll hoặc card stack |
| Modal | Centered overlay | Full-width bottom sheet |
| Dropdown | Click open | Full-width bottom sheet |
| Tabs | Horizontal | Scrollable horizontal |

---

## 10. Accessibility Checklist

- [ ] Color contrast: WCAG AA (4.5:1 text, 3:1 UI) — test tất cả trạng thái
- [ ] Seat status: phân biệt bằng icon + pattern (không chỉ màu)
- [ ] Keyboard navigation: Tab order logic, arrow keys cho seat map
- [ ] Focus visible: ring-2 emerald-500 cho mọi focusable element
- [ ] Screen reader: aria-label cho seats, buttons, images
- [ ] Skip nav: "Bỏ qua đến nội dung chính" link ẩn
- [ ] Form labels: mọi input có label hoặc aria-label
- [ ] Error announcements: aria-live="polite" cho form errors
- [ ] Reduced motion: `prefers-reduced-motion` → tắt animation
- [ ] Alt text: tất cả ảnh event (`alt={event.title}`)
- [ ] Touch targets: min 44x44px
- [ ] Zoom: support browser zoom lên 200% không vỡ layout

---

## 11. Illustration & Empty State Style

| Trường hợp | Illustration | Text |
|-----------|-------------|------|
| Chưa có vé | Vé bay trong gió (line art, violet accent) | "Bạn chưa có vé nào. Khám phá sự kiện ngay!" |
| Không tìm thấy | Kính lúp + dấu hỏi | "Không tìm thấy kết quả. Thử từ khóa khác?" |
| Lỗi server | Robot buồn | "Đã xảy ra lỗi. Vui lòng thử lại sau." |
| 404 | Spotlight rọi vào sân khấu trống | "Trang này không tồn tại." |
| Giỏ hàng trống | Ghế trống trong rạp | "Chưa chọn ghế nào." |
| Offline | Wifi icon gạch chéo | "Mất kết nối. Kiểm tra internet." |

Style: **Line art** + 1 accent color (violet hoặc orange). Minimalist, không quá chi tiết. Có thể dùng Lucide icons phóng to thay illustration phức tạp.

---

## 12. Trending Effects 2025-2026

### 12.1 Animated Gradient Text (Hero headlines)

```css
.gradient-text {
  background: linear-gradient(135deg, #7C3AED, #F97316, #8B5CF6);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease-in-out infinite;
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```
Dùng cho: hero title landing page, countdown label "Flash Sale", section headings quan trọng.

### 12.2 Gradient Borders

```css
.gradient-border {
  position: relative;
  border-radius: 12px;
  background: var(--bg-secondary);
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, #7C3AED, #F97316);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```
Dùng cho: featured event card, pricing tier đang chọn, CTA card.

### 12.3 Bento Grid Layout

```
┌──────────────┬───────┬───────┐
│              │       │       │
│  Large card  │ Small │ Small │   ← Admin dashboard
│  (2×2)       │ (1×1) │ (1×1) │      hoặc landing features
│              │       │       │
├──────┬───────┼───────┴───────┤
│      │       │               │
│ Sm   │ Sm    │  Medium card  │
│(1×1) │(1×1)  │  (2×1)        │
└──────┴───────┴───────────────┘
```
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.bento-grid > .large { grid-column: span 2; grid-row: span 2; }
.bento-grid > .medium { grid-column: span 2; }
/* Mobile: 1 col stack */
@media (max-width: 768px) {
  .bento-grid { grid-template-columns: 1fr; }
  .bento-grid > .large, .bento-grid > .medium { grid-column: span 1; grid-row: span 1; }
}
```
Dùng cho: admin dashboard stats, landing page "Tại sao TicketRush".

### 12.4 Neon Glow (Dark mode emphasis)

```css
.neon-glow {
  box-shadow:
    0 0 5px rgba(5,150,105,0.3),
    0 0 20px rgba(5,150,105,0.15),
    0 0 40px rgba(5,150,105,0.05);
}
.neon-glow-orange {
  box-shadow:
    0 0 5px rgba(249,115,22,0.3),
    0 0 20px rgba(249,115,22,0.15);
}
```
Dùng cho: active seat, CTA button hover, featured event card, countdown timer critical state.

### 12.5 Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
Variants: text-line (h-4 w-3/4), text-short (h-4 w-1/2), card (h-64), avatar (rounded-full), button (h-10 w-24).

---

## 13. Page Layout Compositions

### 13.1 Landing Page

```
┌────────────────────────────────────────────────┐
│                 HEADER (sticky)                 │
├────────────────────────────────────────────────┤
│                                                │
│  ███ IMMERSIVE HERO (100vh) ███               │  ← Mesh gradient bg
│  ┌─────────────────────────────────────────┐  │     + noise texture
│  │  "Trải nghiệm âm nhạc                  │  │     + spotlight radial
│  │   không giới hạn"                       │  │  ← Animated gradient text (h1)
│  │                                         │  │
│  │  [🔍 Tìm kiếm sự kiện...]              │  │  ← Search bar glass overlay
│  │  [Hôm nay] [Tuần này] [Nhạc] [Kịch]   │  │  ← Filter chips
│  │                                         │  │
│  │  ┌─ Featured Event Card ─────────────┐ │  │  ← Glassmorphism card lớn
│  │  │  Banner + Title + Date + CTA      │ │  │     gradient border
│  │  └───────────────────────────────────┘ │  │
│  └─────────────────────────────────────────┘  │
│                                                │
├── SẮP MỞ BÁN (scroll reveal) ─────────────────┤
│  ← Carousel: EventCard + Countdown + "Nhắc"   │
│                                                │
├── ĐANG TRENDING ───────────────────────────────┤
│  ← 4-col grid (3-col tablet, 1-col mobile)    │
│  EventCards glassmorphism + badges             │
│                                                │
├── THỂ LOẠI ────────────────────────────────────┤
│  ← Horizontal scroll chips + icon              │
│                                                │
├── 3 BƯỚC (inline) ─────────────────────────────┤
│  [🎯 Chọn] → [💺 Đặt] → [📱 Nhận QR]        │
│                                                │
├────────────────────────────────────────────────┤
│                   FOOTER                        │
└────────────────────────────────────────────────┘
```

### 13.2 Auth Pages (Login / Register)

```
┌────────────────────────────────────────────────┐
│  Mesh gradient background + noise              │
│                                                │
│         ┌─── Auth Card (glass) ───┐           │
│         │  Logo TicketRush         │           │
│         │                          │           │
│         │  [Google Login Button]   │           │  ← Nổi bật, ở trên cùng
│         │  ─── hoặc ────          │           │
│         │  Email    [___________]  │           │
│         │  Password [___________]  │           │
│         │  □ Nhớ đăng nhập         │           │
│         │                          │           │
│         │  [Turnstile CAPTCHA]     │           │
│         │                          │           │
│         │  [  ĐĂNG NHẬP  ] (xl)   │           │  ← Accent gradient button
│         │                          │           │
│         │  Chưa có tài khoản?     │           │
│         │  Đăng ký ngay →          │           │
│         └──────────────────────────┘           │
│                                                │
└────────────────────────────────────────────────┘
  max-w-md, centered vertically + horizontally
```

### 13.3 Event Detail

```
┌────────────────────────────────────────────────┐
│ Breadcrumb: Trang chủ > Nhạc > Tên sự kiện    │
├────────────────────────────────────────────────┤
│  ┌─ Hero Banner (aspect 21:9) ──────────────┐ │
│  │  Gradient overlay bottom                  │ │
│  │  Event Title (h1, gradient text)          │ │
│  │  📅 Date  📍 Venue  🎫 Từ 500.000₫      │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  ┌─ Content (2 col: 8+4) ──────────────────┐ │
│  │ LEFT (8 col)        │ RIGHT (4 col)      │ │
│  │                      │                    │ │
│  │ Mô tả sự kiện       │ ┌─ Pricing Card ─┐│ │
│  │ (rich text)          │ │ VIP  500.000₫  ││ │
│  │                      │ │ Reg  300.000₫  ││ │
│  │                      │ │ [CHỌN GHẾ] CTA││ │  ← sticky trên mobile
│  │                      │ └────────────────┘│ │
│  │ Sự kiện tương tự     │ Share buttons     │ │
│  └──────────────────────┴────────────────────┘ │
└────────────────────────────────────────────────┘
  Mobile: stack, CTA sticky bottom bar
```

### 13.4 Checkout

```
┌────────────────────────────────────────────────┐
│  Logo (minimal header)        ⏱️ 09:45        │  ← Countdown sticky
├────────────────────────────────────────────────┤
│                                                │
│  ┌─ 2-col layout (7+5) ───────────────────┐  │
│  │ LEFT: Order Summary    │ RIGHT: Payment │  │
│  │                        │                │  │
│  │ Event: Tên sự kiện    │ Phương thức:   │  │
│  │ Ghế: VIP-A1, VIP-A2   │ ○ VNPay       │  │
│  │ Giá: 500.000₫ × 2     │ ○ MoMo        │  │
│  │                        │ ● Giả lập     │  │
│  │ Mã giảm giá:          │                │  │
│  │ [SUMMER2026] [Áp dụng]│                │  │
│  │ Giảm: -100.000₫       │                │  │
│  │ ──────────────         │                │  │
│  │ Tổng: 900.000₫        │ [ THANH TOÁN ] │  │  ← Accent button xl
│  └────────────────────────┴────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
  Mobile: stack, countdown sticky top, CTA sticky bottom
  Warning <2min: border-amber, bg-amber-500/5
  Critical <30s: border-rose, pulsing glow
```

### 13.5 Admin Dashboard (Bento Grid)

```
┌─────────┬──────────────────────────────────────┐
│         │  Header: "Dashboard" + Date picker    │
│ SIDEBAR │                                       │
│         │  ┌── Bento Grid ──────────────────┐  │
│ Logo    │  │ Revenue    │ Tickets │ Events   │  │  ← Stats cards + sparklines
│         │  │ (large 2×1)│ (1×1)   │ (1×1)    │  │
│ Menu:   │  ├───────────┼─────────┴──────────┤  │
│ □ Dash  │  │ Revenue   │ Seat Heatmap       │  │  ← Charts
│ □ Events│  │ Chart     │ (interactive)       │  │
│ □ Users │  │ (2×1)     │ (2×1)              │  │
│ □ Books │  ├───────────┼────────────────────┤  │
│ □ Promo │  │ Audience  │ Conversion         │  │
│ □ Report│  │ Pie+Bar   │ Funnel             │  │
│         │  │ (1×1)     │ (1×1)              │  │
│         │  ├───────────┴────────────────────┤  │
│ Avatar  │  │ Recent Bookings (full width)    │  │  ← Table
│ Admin   │  │ Live Activity Feed              │  │  ← Real-time
│         │  └────────────────────────────────┘  │
└─────────┴──────────────────────────────────────┘
  Sidebar collapsed (64px): icons only
  Mobile: bottom nav, charts full-width stack
```

### 13.6 Seat Selection (Split view)

```
┌────────────────────────────────────────────────┐
│ Breadcrumb + Event name + Countdown ⏱️         │
├──────────────────────────────┬─────────────────┤
│                              │                 │
│   ┌── STAGE ──────────┐     │  Ghế đã chọn:  │
│   └───────────────────┘     │                 │
│                              │  VIP-A1 500K   │
│   ┌─ VIP ─────────────┐    │  VIP-A2 500K   │
│   │ [A1][A2][A3]...   │    │                 │
│   │ [B1][B2][B3]...   │    │  Mã giảm giá:  │
│   └────────────────────┘    │  [______][OK]  │
│                              │                 │
│   ┌─ Regular ─────────┐    │  ────────────── │
│   │ [C1][C2][C3]...   │    │  Tổng: 900.000₫│
│   └────────────────────┘    │                 │
│                              │  [TIẾP TỤC ▶]  │
│   Legend: 🟢🟣🟡⚫⬛      │                 │
│                              │                 │
├──────────────────────────────┴─────────────────┤
│  Zoom: [−] ████░░░░ [+]     Mini-map □        │
└────────────────────────────────────────────────┘
  Mobile: map fullscreen + bottom sheet (sidebar content)
  Pinch zoom + pan, mini-map góc phải dưới
```

---

## 14. Common Component Specs (bổ sung)

### 14.1 Header / Navbar

```
Customer:
┌──────────────────────────────────────────────────────┐
│ [Logo]  Sự kiện  Trang chủ   [🔍] [🌐] [🔔2] [👤] │
└──────────────────────────────────────────────────────┘

Admin (thêm nút Quản trị):
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Sự kiện  Trang chủ   [⚙️ Quản trị] [🔍] [🌐] [🔔2] [👤] │
└──────────────────────────────────────────────────────────────┘
```
- Height: 64px, sticky top, z-50
- bg-zinc-950/80, backdrop-blur-lg, border-b zinc-800
- Logo: h-8, clickable → home
- Nav links: text-zinc-400, hover text-white, active text-emerald-400
- **"Quản trị" button:** Chỉ hiện khi `user.role === 'admin'`. Lucide `LayoutDashboard` icon + text. bg-emerald-600/10, text-emerald-400, hover bg-emerald-600/20. Click → `/admin`
- **Language switcher (🌐):** Dropdown "Tiếng Việt" / "English", Lucide `Globe` icon. Persist localStorage
- Search icon: expand → full-width search bar (glass bg)
- Notification bell: Lucide `Bell`, unread badge
- Avatar: 32px, dropdown (Profile, Vé của tôi, Yêu thích, Đăng xuất). Admin thêm "Quản trị" link trong dropdown
- Mobile: logo + notification + avatar only. Bottom tab bar thay nav links. "Quản trị" trong avatar dropdown

### 14.2 Footer

```
┌────────────────────────────────────────────────┐
│  Logo + tagline          Sự kiện  |  Hỗ trợ   │
│  "Trải nghiệm âm nhạc   Tất cả   |  FAQ      │
│   không giới hạn"        Trending  |  Liên hệ │
│                          Sắp mở   |  Điều khoản│
│                                    |  Bảo mật  │
│  Mạng xã hội: [fb] [ig] [tw]                  │
│                                                │
│  Newsletter: [Email...] [Đăng ký]              │
│  ─────────────────────────────────────────     │
│  © 2026 TicketRush. All rights reserved.       │
└────────────────────────────────────────────────┘
```
- bg-zinc-950, border-t zinc-800
- Grid: 3 columns (brand, links, support). Mobile: stack
- Links: text-zinc-400, hover text-emerald-400
- Newsletter: input sm + button sm

### 14.3 Search Bar (Expanded)

- Height: 48px, rounded-full (pill shape)
- bg: glass (zinc-900/60 + backdrop-blur)
- border: 1px zinc-700, focus: emerald-500
- Icon: Lucide `Search` left, `X` clear right
- Autocomplete dropdown: bg-zinc-900, border zinc-800, max-h-80
- Suggestion item: hover bg-zinc-800, icon left (event/category), text + badge
- Recent searches: section header "Tìm kiếm gần đây", text-zinc-500
- Keyboard: ↑↓ navigate, Enter select, Esc close

### 14.4 Breadcrumb

- text-sm, zinc-400
- Separator: Lucide `ChevronRight`, zinc-600
- Last item: text-zinc-200, font-medium (current page)
- Truncate middle items if > 3: "Trang chủ > ... > Tên sự kiện"
- Mobile: chỉ hiện "← Quay lại" thay breadcrumb đầy đủ

### 14.5 Accordion (FAQ)

- Trigger: h4 + Lucide `ChevronDown` (rotate 180° khi mở)
- border-b zinc-800
- Open: content slide down 200ms ease
- Content: body text, zinc-300

### 14.6 Carousel (Embla)

- Dots indicator: bottom center, dot 8px, active emerald-500, inactive zinc-600
- Navigation arrows: 40px circles, glass bg, Lucide `ChevronLeft/Right`
- Slide: snap scroll, gap 16px
- Mobile: swipe, no arrows (touch only), dots smaller (6px)
- Auto-play: 5s interval, pause on hover/touch

### 14.7 Form Layout

```
┌─ Form Card (glass, max-w-md) ──────────────┐
│                                              │
│  Label (body-sm, zinc-300, font-medium)     │
│  [Input field ___________________________]  │
│  Helper text hoặc error (caption)           │
│                                              │
│  Label                                      │
│  [Input] [Input]  ← 2 columns khi có       │
│                                              │
│  [Submit Button (full width)]               │
│                                              │
└──────────────────────────────────────────────┘
```
- Field spacing: gap-y 20px (space-y-5)
- Label + input spacing: gap-y 6px
- Error: rose-400 text + rose-500 border, icon `AlertCircle`
- Success feedback: emerald checkmark inline
