import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { MinimalLayout } from '../layouts/MinimalLayout';
// AdminLayout lazy-loaded — chỉ parse bundle khi user vào /admin/*
const AdminLayout = lazy(() => import('../layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })));
import { AuthGuard } from '../features/auth/components/AuthGuard';
import { AdminGuard } from '../features/auth/components/AdminGuard';

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// Lazy components phải được tạo ở MODULE LEVEL — KHÔNG bên trong function/component
// (React.lazy tạo bên trong render → component type mới mỗi lần → crash)
const LandingPage = lazy(() => import('../features/landing/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const EventsPage = lazy(() => import('../features/events/pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('../features/events/pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const SeatSelectionPage = lazy(() => import('../features/booking/pages/SeatSelectionPage').then((m) => ({ default: m.SeatSelectionPage })));
const CheckoutPage = lazy(() => import('../features/booking/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const BookingSuccessPage = lazy(() => import('../features/booking/pages/BookingSuccessPage').then((m) => ({ default: m.BookingSuccessPage })));
const MomoReturnPage = lazy(() => import('../features/booking/pages/MomoReturnPage').then((m) => ({ default: m.MomoReturnPage })));
const MyTicketsPage = lazy(() => import('../features/tickets/pages/MyTicketsPage').then((m) => ({ default: m.MyTicketsPage })));
const FavoritesPage = lazy(() => import('../features/favorites/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ProfilePage = lazy(() => import('../features/user/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

const AboutPage = lazy(() => import('../features/static/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const FAQPage = lazy(() => import('../features/static/pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const TermsPage = lazy(() => import('../features/static/pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('../features/static/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ContactPage = lazy(() => import('../features/static/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import('../features/static/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const EmailVerifyPage = lazy(() => import('../features/auth/pages/EmailVerifyPage').then((m) => ({ default: m.EmailVerifyPage })));

const AdminDashboardPage = lazy(() => import('../features/admin/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminEventsPage = lazy(() => import('../features/admin/pages/EventListPage').then((m) => ({ default: m.EventListPage })));
const AdminEventCreatePage = lazy(() => import('../features/admin/pages/EventCreatePage').then((m) => ({ default: m.EventCreatePage })));
const AdminEventEditPage = lazy(() => import('../features/admin/pages/EventEditPage').then((m) => ({ default: m.EventEditPage })));
const AdminUsersPage = lazy(() => import('../features/admin/pages/UserManagementPage').then((m) => ({ default: m.UserManagementPage })));
const AdminBookingsPage = lazy(() => import('../features/admin/pages/BookingManagementPage').then((m) => ({ default: m.BookingManagementPage })));
const AdminVenuesPage = lazy(() => import('../features/admin/pages/VenueManagementPage').then((m) => ({ default: m.VenueManagementPage })));
const AdminPromoPage = lazy(() => import('../features/admin/pages/PromoManagementPage').then((m) => ({ default: m.PromoManagementPage })));
const AdminReportsPage = lazy(() => import('../features/admin/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const AdminAuditPage = lazy(() => import('../features/admin/pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const AdminChatPage  = lazy(() => import('../features/admin/pages/AdminChatPage').then((m) => ({ default: m.AdminChatPage })));
const WaitingRoomPage = lazy(() => import('../features/queue/pages/WaitingRoomPage').then((m) => ({ default: m.WaitingRoomPage })));

export const router = createBrowserRouter([
  // Customer routes
  {
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(LandingPage) },
      { path: 'events', element: withSuspense(EventsPage) },
      { path: 'events/:slug', element: withSuspense(EventDetailPage) },
      { path: 'events/:slug/seats', element: <AuthGuard>{withSuspense(SeatSelectionPage)}</AuthGuard> },
      { path: 'queue/:slug/:eventId', element: <AuthGuard>{withSuspense(WaitingRoomPage)}</AuthGuard> },
      { path: 'my-tickets', element: <AuthGuard>{withSuspense(MyTicketsPage)}</AuthGuard> },
      { path: 'favorites', element: <AuthGuard>{withSuspense(FavoritesPage)}</AuthGuard> },
      { path: 'profile', element: <AuthGuard>{withSuspense(ProfilePage)}</AuthGuard> },
      { path: 'about', element: withSuspense(AboutPage) },
      { path: 'faq', element: withSuspense(FAQPage) },
      { path: 'terms', element: withSuspense(TermsPage) },
      { path: 'privacy', element: withSuspense(PrivacyPage) },
      { path: 'contact', element: withSuspense(ContactPage) },
    ],
  },

  // Minimal layout (checkout)
  {
    element: <MinimalLayout />,
    children: [
      { path: 'checkout/:bookingId', element: <AuthGuard>{withSuspense(CheckoutPage)}</AuthGuard> },
      { path: 'checkout/:bookingId/momo-return', element: <AuthGuard>{withSuspense(MomoReturnPage)}</AuthGuard> },
      { path: 'booking-success/:bookingId', element: <AuthGuard>{withSuspense(BookingSuccessPage)}</AuthGuard> },
    ],
  },

  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withSuspense(LoginPage) },
      { path: 'register', element: withSuspense(RegisterPage) },
      { path: 'forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: 'reset-password', element: withSuspense(ResetPasswordPage) },
      { path: 'verify-email', element: withSuspense(EmailVerifyPage) },
    ],
  },

  // Admin routes
  {
    path: 'admin',
    element: <AdminGuard><Suspense fallback={<PageLoader />}><AdminLayout /></Suspense></AdminGuard>,
    children: [
      { index: true, element: withSuspense(AdminDashboardPage) },
      { path: 'events', element: withSuspense(AdminEventsPage) },
      { path: 'events/create', element: withSuspense(AdminEventCreatePage) },
      { path: 'events/:id/edit', element: withSuspense(AdminEventEditPage) },
      { path: 'users', element: withSuspense(AdminUsersPage) },
      { path: 'bookings', element: withSuspense(AdminBookingsPage) },
      { path: 'venues', element: withSuspense(AdminVenuesPage) },
      { path: 'promo', element: withSuspense(AdminPromoPage) },
      { path: 'reports', element: withSuspense(AdminReportsPage) },
      { path: 'audit', element: withSuspense(AdminAuditPage) },
      { path: 'chat',  element: withSuspense(AdminChatPage)  },
    ],
  },

  // 404 catch-all
  { path: '*', element: withSuspense(NotFoundPage) },
]);
