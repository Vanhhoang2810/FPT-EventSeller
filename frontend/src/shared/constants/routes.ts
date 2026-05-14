export const ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:slug',
  SEAT_SELECTION: '/events/:slug/seats',
  CHECKOUT: '/checkout/:bookingId',
  BOOKING_SUCCESS: '/booking-success/:bookingId',
  MY_TICKETS: '/my-tickets',
  TICKET_DETAIL: '/my-tickets/:id',
  FAVORITES: '/favorites',
  QUEUE: '/queue/:eventId',
  PROFILE: '/profile',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  OAUTH_CALLBACK: '/auth/callback',

  // Admin
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_EVENT_CREATE: '/admin/events/create',
  ADMIN_EVENT_EDIT: '/admin/events/:id/edit',
  ADMIN_USERS: '/admin/users',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_PROMO: '/admin/promo',
  ADMIN_VENUES: '/admin/venues',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_CHAT:  '/admin/chat',

  // Static
  ABOUT: '/about',
  FAQ: '/faq',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  CONTACT: '/contact',
};
