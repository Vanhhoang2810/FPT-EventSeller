# Cấu trúc thư mục

> **Ticket Rush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | **Folder Structure** | [Database](database.md) | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../DESIGN.md)

---

## 2. Cấu trúc thư mục

### 2.1 Tổng quan Monorepo

```
Ticket Rush/
├── frontend/
├── backend/
├── docs/              # 9 files tài liệu kỹ thuật
├── DESIGN.md          # Design system
├── CONTEXT.md         # Đề bài gốc
├── README.md
└── .gitignore
```

### 2.2 Frontend — Feature-based Architecture

```
frontend/
├── .env.example
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── components.json
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   └── manifest.json              # PWA basic
└── src/
    ├── main.tsx
    ├── App.tsx
    │
    ├── app/
    │   ├── store.ts
    │   ├── router.tsx              # Lazy-loaded routes
    │   ├── providers.tsx
    │   ├── api.ts                  # RTK Query base (auto refresh 401)
    │   └── i18n.ts                 # i18next config + init
    │
    ├── locales/                    # === ĐA NGÔN NGỮ ===
    │   ├── vi/
    │   │   ├── common.json         # Chung: buttons, labels, nav
    │   │   ├── auth.json           # Đăng nhập, đăng ký
    │   │   ├── events.json         # Sự kiện, tìm kiếm
    │   │   ├── booking.json        # Đặt vé, checkout, countdown
    │   │   ├── tickets.json        # Vé, QR
    │   │   ├── admin.json          # Dashboard, quản trị
    │   │   ├── queue.json          # Hàng chờ
    │   │   └── errors.json         # Thông báo lỗi
    │   └── en/
    │       ├── common.json
    │       ├── auth.json
    │       ├── events.json
    │       ├── booking.json
    │       ├── tickets.json
    │       ├── admin.json
    │       ├── queue.json
    │       └── errors.json
    │
    ├── features/
    │   ├── landing/
    │   │   ├── components/
    │   │   │   ├── ImmersiveHero.tsx        # Full-viewport event showcase + ambient color
    │   │   │   ├── TrendingEvents.tsx       # Sự kiện hot (rank theo vé bán)
    │   │   │   ├── UpcomingSales.tsx         # Sắp mở bán + countdown + "Nhắc tôi"
    │   │   │   ├── QuickFilterChips.tsx      # Chips: Hôm nay, Tuần này, Nhạc, Kịch...
    │   │   │   ├── EventCalendarMini.tsx     # Mini calendar → click ngày xem events
    │   │   │   ├── CategoryShowcase.tsx      # Horizontal scrollable categories
    │   │   │   ├── AtmosphereBackground.tsx  # Gradient blobs, noise, particles
    │   │   │   └── HowItWorks.tsx            # 1 row inline (3 bước)
    │   │   └── pages/
    │   │       └── LandingPage.tsx
    │   │
    │   ├── auth/
    │   │   ├── components/
    │   │   │   ├── LoginForm.tsx
    │   │   │   ├── RegisterForm.tsx
    │   │   │   ├── GoogleLoginButton.tsx     # @react-oauth/google
    │   │   │   ├── CaptchaWidget.tsx         # Cloudflare Turnstile
    │   │   │   ├── ForgotPasswordForm.tsx
    │   │   │   ├── ResetPasswordForm.tsx
    │   │   │   ├── AuthGuard.tsx
    │   │   │   └── AdminGuard.tsx        # Check role === 'admin'
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts
    │   │   ├── services/
    │   │   │   └── authApi.ts
    │   │   ├── store/
    │   │   │   └── authSlice.ts
    │   │   ├── pages/
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── RegisterPage.tsx
    │   │   │   ├── ForgotPasswordPage.tsx
    │   │   │   ├── ResetPasswordPage.tsx
    │   │   │   ├── EmailVerifyPage.tsx
    │   │   │   └── OAuthCallbackPage.tsx
    │   │   └── types.ts
    │   │
    │   ├── events/
    │   │   ├── components/
    │   │   │   ├── EventCard.tsx             # Glassmorphism overlay, badges, starting price
    │   │   │   ├── EventList.tsx
    │   │   │   ├── EventSearchBar.tsx        # Autocomplete suggestions
    │   │   │   ├── EventFilters.tsx
    │   │   │   ├── EventDetailHero.tsx
    │   │   │   ├── EventInfo.tsx
    │   │   │   ├── EventPricing.tsx
    │   │   │   └── EventShareButton.tsx
    │   │   ├── hooks/
    │   │   │   └── useEventFilters.ts
    │   │   ├── services/
    │   │   │   └── eventsApi.ts
    │   │   ├── pages/
    │   │   │   ├── EventsPage.tsx
    │   │   │   └── EventDetailPage.tsx
    │   │   └── types.ts
    │   │
    │   ├── booking/
    │   │   ├── components/
    │   │   │   ├── SeatMap.tsx               # ★ Interactive seat map (SVG/Canvas)
    │   │   │   ├── SeatCell.tsx
    │   │   │   ├── SeatLegend.tsx
    │   │   │   ├── SeatMiniMap.tsx           # Mini-map overview (mobile)
    │   │   │   ├── ZoneLabel.tsx
    │   │   │   ├── SeatTooltip.tsx
    │   │   │   ├── SelectedSeats.tsx
    │   │   │   ├── BookingSummary.tsx
    │   │   │   ├── CountdownTimer.tsx
    │   │   │   ├── CheckoutForm.tsx
    │   │   │   └── PaymentConfirmation.tsx
    │   │   ├── hooks/
    │   │   │   ├── useSeatMap.ts
    │   │   │   ├── useBookingTimer.ts
    │   │   │   ├── useSeatSelection.ts
    │   │   │   ├── useSeatGestures.ts       # Pinch zoom, pan (mobile)
    │   │   │   └── useEventStatus.ts       # Listen event:cancelled → redirect + notify
    │   │   ├── services/
    │   │   │   └── bookingApi.ts
    │   │   ├── pages/
    │   │   │   ├── SeatSelectionPage.tsx
    │   │   │   ├── CheckoutPage.tsx
    │   │   │   └── BookingSuccessPage.tsx
    │   │   └── types.ts
    │   │
    │   ├── tickets/
    │   │   ├── components/
    │   │   │   ├── TicketCard.tsx
    │   │   │   ├── TicketDetail.tsx
    │   │   │   ├── QRCodeDisplay.tsx         # Fullscreen + animated overlay
    │   │   │   └── TicketStatusBadge.tsx
    │   │   ├── services/
    │   │   │   └── ticketsApi.ts
    │   │   ├── pages/
    │   │   │   ├── MyTicketsPage.tsx
    │   │   │   └── TicketDetailPage.tsx
    │   │   └── types.ts
    │   │
    │   ├── queue/
    │   │   ├── components/
    │   │   │   ├── QueuePosition.tsx
    │   │   │   ├── QueueProgress.tsx
    │   │   │   ├── QueueAnimation.tsx
    │   │   │   └── QueueNotification.tsx
    │   │   ├── hooks/
    │   │   │   └── useQueue.ts
    │   │   ├── services/
    │   │   │   └── queueApi.ts
    │   │   └── pages/
    │   │       └── WaitingRoomPage.tsx
    │   │
    │   ├── notifications/
    │   │   ├── components/
    │   │   │   ├── NotificationBell.tsx      # Header bell icon + unread count
    │   │   │   ├── NotificationDropdown.tsx
    │   │   │   └── NotificationItem.tsx
    │   │   ├── hooks/
    │   │   │   └── useNotifications.ts
    │   │   ├── services/
    │   │   │   └── notificationsApi.ts
    │   │   └── types.ts
    │   │
    │   ├── user/
    │   │   ├── components/
    │   │   │   ├── ProfileForm.tsx
    │   │   │   ├── ChangePasswordForm.tsx
    │   │   │   ├── BookingHistory.tsx
    │   │   │   └── NotificationSettings.tsx  # Toggle email preferences
    │   │   ├── services/
    │   │   │   └── userApi.ts
    │   │   └── pages/
    │   │       └── ProfilePage.tsx
    │   │
    │   ├── favorites/
    │   │   ├── components/
    │   │   │   └── FavoriteButton.tsx     # Heart icon toggle
    │   │   ├── services/
    │   │   │   └── favoritesApi.ts
    │   │   └── pages/
    │   │       └── FavoritesPage.tsx
    │   │
    │   ├── promo/
    │   │   ├── components/
    │   │   │   └── PromoCodeInput.tsx     # Input + validate + show discount
    │   │   └── services/
    │   │       └── promoApi.ts
    │   │
    │   ├── static/
    │   │   └── pages/
    │   │       ├── AboutPage.tsx
    │   │       ├── FAQPage.tsx
    │   │       ├── TermsPage.tsx
    │   │       ├── PrivacyPage.tsx
    │   │       └── ContactPage.tsx
    │   │
    │   └── admin/
    │       ├── components/
    │       │   ├── dashboard/
    │       │   │   ├── StatsOverview.tsx
    │       │   │   ├── RevenueChart.tsx
    │       │   │   ├── SeatFillChart.tsx
    │       │   │   ├── SeatHeatmap.tsx       # Heatmap ghế bán chạy
    │       │   │   ├── AudienceDemographics.tsx
    │       │   │   ├── ConversionFunnel.tsx   # View → Select → Lock → Pay
    │       │   │   ├── PeakHoursChart.tsx     # Giờ cao điểm mua vé
    │       │   │   ├── TrendSparklines.tsx    # Mini sparklines trên stats cards
    │       │   │   ├── RecentBookings.tsx
    │       │   │   └── LiveActivityFeed.tsx
    │       │   ├── events/
    │       │   │   ├── EventForm.tsx
    │       │   │   ├── EventTable.tsx
    │       │   │   ├── EventStatusBadge.tsx
    │       │   │   └── EventActions.tsx
    │       │   ├── users/
    │       │   │   ├── UserTable.tsx
    │       │   │   ├── UserDetail.tsx
    │       │   │   └── UserActions.tsx        # Ban/unban
    │       │   ├── bookings/
    │       │   │   ├── BookingTable.tsx
    │       │   │   ├── BookingDetail.tsx
    │       │   │   └── RefundAction.tsx
    │       │   └── seat-map/
    │       │       ├── SeatMapBuilder.tsx
    │       │       ├── ZoneConfig.tsx
    │       │       ├── SeatMapPreview.tsx
    │       │       └── BulkSeatActions.tsx
    │       ├── services/
    │       │   └── adminApi.ts
    │       ├── pages/
    │       │   ├── DashboardPage.tsx
    │       │   ├── EventListPage.tsx
    │       │   ├── EventCreatePage.tsx
    │       │   ├── EventEditPage.tsx
    │       │   ├── SeatMapSetupPage.tsx
    │       │   ├── UserManagementPage.tsx
    │       │   ├── BookingManagementPage.tsx
    │       │   ├── ReportsPage.tsx           # Export CSV/PDF
    │       │   ├── PromoManagementPage.tsx  # CRUD mã giảm giá
    │       │   ├── VenueManagementPage.tsx  # CRUD venues
    │       │   └── AuditLogsPage.tsx        # Xem audit trail (read-only)
    │       └── types.ts
    │
    ├── shared/
    │   ├── components/
    │   │   ├── ui/                  # shadcn/ui (Button, Input, Dialog, etc.)
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Breadcrumb.tsx
    │   │   ├── LoadingScreen.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── NotFound.tsx
    │   │   ├── OfflineIndicator.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── Toast.tsx
    │   │   ├── CookieConsent.tsx  # Cookie consent banner
    │   │   ├── ThemeToggle.tsx
    │   │   ├── LanguageSwitcher.tsx  # Toggle vi/en + persist localStorage
    │   │   ├── BackToTop.tsx
    │   │   ├── ScrollToTop.tsx
    │   │   ├── SEOHead.tsx
    │   │   ├── Autocomplete.tsx     # Search suggestions
    │   │   ├── CurrencyInput.tsx    # Auto-format VND
    │   │   ├── PhoneInput.tsx       # Input mask 0912 345 678
    │   │   └── SkipNavLink.tsx      # Accessibility
    │   ├── hooks/
    │   │   ├── useSocket.ts
    │   │   ├── useDebounce.ts
    │   │   ├── useMediaQuery.ts
    │   │   ├── useLocalStorage.ts
    │   │   ├── usePageTitle.ts
    │   │   ├── useTouchDevice.ts
    │   │   └── usePullToRefresh.ts
    │   ├── utils/
    │   │   ├── cn.ts
    │   │   ├── formatDate.ts
    │   │   ├── formatCurrency.ts
    │   │   └── validators.ts
    │   ├── types/
    │   │   └── index.ts
    │   └── constants/
    │       ├── routes.ts
    │       └── config.ts
    │
    ├── layouts/
    │   ├── MainLayout.tsx
    │   ├── AdminLayout.tsx
    │   ├── AuthLayout.tsx
    │   └── MinimalLayout.tsx
    │
    └── styles/
        └── globals.css
```

### 2.3 Backend — Module-based Layered Architecture

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── .sequelizerc
├── nodemon.json
└── src/
    ├── index.ts
    ├── app.ts
    │
    ├── config/
    │   ├── env.ts
    │   ├── database.ts
    │   ├── redis.ts
    │   ├── socket.ts
    │   ├── passport.ts            # Google OAuth strategy
    │   ├── email.ts               # Nodemailer transport
    │   └── swagger.ts             # Swagger/OpenAPI spec config
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.routes.ts
    │   │   ├── auth.validation.ts
    │   │   └── auth.types.ts
    │   ├── users/
    │   │   ├── users.controller.ts
    │   │   ├── users.service.ts
    │   │   ├── users.routes.ts
    │   │   ├── users.validation.ts
    │   │   └── users.types.ts
    │   ├── events/
    │   │   ├── events.controller.ts
    │   │   ├── events.service.ts
    │   │   ├── events.routes.ts
    │   │   ├── events.validation.ts
    │   │   └── events.types.ts
    │   ├── booking/
    │   │   ├── booking.controller.ts
    │   │   ├── booking.service.ts
    │   │   ├── booking.routes.ts
    │   │   ├── booking.validation.ts
    │   │   └── booking.types.ts
    │   ├── tickets/
    │   │   ├── tickets.controller.ts
    │   │   ├── tickets.service.ts
    │   │   ├── tickets.routes.ts
    │   │   └── tickets.types.ts
    │   ├── payments/
    │   │   ├── payments.controller.ts
    │   │   ├── payments.service.ts
    │   │   ├── payments.routes.ts
    │   │   ├── payments.validation.ts  # Verify VNPay hash, MoMo signature
    │   │   └── payments.types.ts
    │   ├── notifications/
    │   │   ├── notifications.controller.ts
    │   │   ├── notifications.service.ts
    │   │   ├── notifications.routes.ts
    │   │   └── notifications.types.ts
    │   ├── email/
    │   │   ├── email.service.ts
    │   │   └── templates/
    │   │       ├── welcome.html
    │   │       ├── verify-email.html
    │   │       ├── booking-confirmed.html
    │   │       ├── booking-reminder.html
    │   │       ├── booking-expired.html
    │   │       ├── event-reminder.html
    │   │       ├── event-cancelled.html
    │   │       └── reset-password.html
    │   ├── admin/
    │   │   ├── admin.controller.ts
    │   │   ├── admin.service.ts
    │   │   ├── admin.routes.ts
    │   │   ├── admin.validation.ts
    │   │   └── admin.types.ts
    │   ├── promo/
    │   │   ├── promo.controller.ts    # validate promo code (customer)
    │   │   ├── promo.service.ts
    │   │   ├── promo.routes.ts
    │   │   └── promo.validation.ts
    │   │
    │   └── queue/
    │       ├── queue.controller.ts
    │       ├── queue.service.ts
    │       ├── queue.routes.ts
    │       ├── queue.validation.ts
    │       └── queue.types.ts
    │
    ├── models/
    │   ├── index.ts
    │   ├── User.ts
    │   ├── Event.ts
    │   ├── Venue.ts
    │   ├── Zone.ts
    │   ├── Seat.ts
    │   ├── Booking.ts
    │   ├── BookingSeat.ts
    │   ├── Ticket.ts
    │   ├── Payment.ts
    │   ├── RefreshToken.ts
    │   ├── Notification.ts
    │   ├── AuditLog.ts
    │   ├── Favorite.ts
    │   ├── PromoCode.ts
    │   └── PromoUsage.ts
    │
    ├── migrations/
    ├── seeders/
    │   ├── 01-admin-user.ts
    │   ├── 02-venues.ts
    │   ├── 03-events.ts
    │   └── 04-seats.ts
    │
    ├── middleware/
    │   ├── auth.middleware.ts
    │   ├── admin.middleware.ts
    │   ├── rateLimiter.middleware.ts
    │   ├── captcha.middleware.ts     # Verify Turnstile token
    │   ├── validation.middleware.ts
    │   ├── errorHandler.middleware.ts
    │   ├── security.middleware.ts   # DDoS (express-slow-down), IP blacklist
    │   └── queue.middleware.ts
    │
    ├── jobs/
    │   ├── seatRelease.job.ts
    │   ├── queueProcessor.job.ts
    │   ├── eventTransition.job.ts
    │   ├── emailSender.job.ts
    │   ├── eventReminder.job.ts
    │   ├── dataCleanup.job.ts       # Dọn expired data (daily cron)
    │   └── index.ts
    │
    ├── websocket/
    │   ├── index.ts
    │   ├── seatMap.handler.ts
    │   ├── queue.handler.ts
    │   └── notification.handler.ts
    │
    ├── utils/
    │   ├── qrCode.ts
    │   ├── logger.ts
    │   ├── apiResponse.ts
    │   ├── pagination.ts
    │   └── csvExport.ts
    │
    └── types/
        ├── express.d.ts
        └── index.ts
```
