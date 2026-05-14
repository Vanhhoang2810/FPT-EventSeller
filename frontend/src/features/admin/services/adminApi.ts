import { apiSlice } from '../../../app/api';
import type { Event } from '../../events/services/eventsApi';

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_amount: number;
  usage_count: number;
  usage_limit: number | null;
  per_user_limit: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city?: string;
  capacity: number;
  image_url?: string;
}

export interface AdminStats {
  totalRevenue: number;
  todayRevenue: number;
  totalUsers: number;
  totalBookings: number;
  activeEvents: number;
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<{ success: boolean; data: AdminStats }, void>({
      query: () => '/admin/dashboard',
    }),

    getAdminEvents: builder.query<
      { success: boolean; data: Event[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { page?: number; limit?: number; search?: string; status?: string }
    >({
      query: (params = {}) => ({ url: '/admin/events', params }),
      providesTags: ['Event'],
    }),

    createEvent: builder.mutation<{ success: boolean; data: Event }, Partial<Event> & Record<string, unknown>>({
      query: (body) => ({ url: '/admin/events', method: 'POST', body }),
      invalidatesTags: ['Event'],
    }),

    updateEvent: builder.mutation<{ success: boolean; data: Event }, { id: number } & Partial<Event> & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/admin/events/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Event'],
    }),

    updateEventStatus: builder.mutation<{ success: boolean; data: Event }, { id: number; status: string }>({
      query: ({ id, status }) => ({ url: `/admin/events/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: ['Event'],
    }),

    setupZones: builder.mutation<{ success: boolean; data: { zones: unknown[]; totalSeats: number } }, { id: number; zones: unknown[] }>({
      query: ({ id, zones }) => ({ url: `/admin/events/${id}/zones`, method: 'POST', body: { zones } }),
      invalidatesTags: ['Event'],
    }),

    getVenues: builder.query<{ success: boolean; data: Venue[] }, void>({
      query: () => '/admin/venues',
      providesTags: ['Event'],
    }),

    createVenue: builder.mutation<{ success: boolean; data: Venue }, Partial<Venue>>({
      query: (body) => ({ url: '/admin/venues', method: 'POST', body }),
      invalidatesTags: ['Event'],
    }),

    updateVenue: builder.mutation<{ success: boolean; data: Venue }, { id: number } & Partial<Venue>>({
      query: ({ id, ...body }) => ({ url: `/admin/venues/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Event'],
    }),

    deleteVenue: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/admin/venues/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Event'],
    }),

    getAdminUsers: builder.query<
      { success: boolean; data: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { page?: number; limit?: number; search?: string }
    >({
      query: (params = {}) => ({ url: '/admin/users', params }),
    }),

    toggleBanUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/admin/users/${id}/ban`, method: 'PUT' }),
    }),

    getAdminBookings: builder.query<
      { success: boolean; data: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { page?: number; status?: string }
    >({
      query: (params = {}) => ({ url: '/admin/bookings', params }),
    }),

    getAdminEventDetail: builder.query<{ success: boolean; data: Event }, number>({
      query: (id) => `/admin/events/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Event', id }],
    }),

    deleteEvent: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/admin/events/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Event'],
    }),

    refundBooking: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/admin/bookings/${id}/refund`, method: 'PUT' }),
    }),

    // Charts
    getRevenueChart: builder.query<
      { success: boolean; data: Array<{ label: string; revenue: number; bookings: number }> },
      { period: 'hour' | 'day' | 'month' | 'year' }
    >({
      query: ({ period }) => ({ url: '/admin/charts/revenue', params: { period } }),
    }),
    getSeatFillStats: builder.query<{ success: boolean; data: Array<{ eventId: number; title: string; total: number; sold: number; fillRate: number }> }, void>({
      query: () => '/admin/charts/seat-fill',
    }),
    getDemographics: builder.query<{
      success: boolean;
      data: {
        gender:    Array<{ name: string; value: number }>;
        ageGroups: Array<{ name: string; value: number }>;
      };
    }, void>({
      query: () => '/admin/charts/demographics',
    }),
    getConversionFunnel: builder.query<{ success: boolean; data: Array<{ stage: string; value: number }> }, void>({
      query: () => '/admin/charts/conversion',
    }),
    getPeakHours: builder.query<{ success: boolean; data: Array<{ hour: number; count: number }> }, void>({
      query: () => '/admin/charts/peak-hours',
    }),

    // Audit logs
    getAuditLogs: builder.query<
      { success: boolean; data: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { page?: number; limit?: number; search?: string; action?: string }
    >({
      query: (params = {}) => ({ url: '/admin/audit-logs', params }),
    }),

    // User detail
    getUserDetail: builder.query<{ success: boolean; data: { user: unknown; bookings: unknown[]; stats: unknown } }, number>({
      query: (id) => `/admin/users/${id}`,
    }),

    // Admin bookings (with search + date filter)
    getAdminBookingsFiltered: builder.query<
      { success: boolean; data: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { page?: number; limit?: number; status?: string; search?: string; startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({ url: '/admin/bookings', params }),
    }),

    // Promo codes
    getPromos: builder.query<{ success: boolean; data: PromoCode[] }, void>({
      query: () => '/promo',
      providesTags: ['Promo'],
    }),
    createPromo: builder.mutation<{ success: boolean; data: PromoCode }, {
      code: string; discountType: string; discountValue: number;
      usageLimit: number | null; perUserLimit: number; minAmount: number;
      startsAt: string; expiresAt: string;
    }>({
      query: (body) => ({ url: '/promo', method: 'POST', body }),
      invalidatesTags: ['Promo'],
    }),
    togglePromo: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/promo/${id}/toggle`, method: 'PUT' }),
      invalidatesTags: ['Promo'],
    }),
    updatePromo: builder.mutation<{ success: boolean; data: PromoCode }, {
      id: number; discountType?: string; discountValue?: number;
      usageLimit?: number | null; perUserLimit?: number; minAmount?: number;
      startsAt?: string; expiresAt?: string;
    }>({
      query: ({ id, ...body }) => ({ url: `/promo/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Promo'],
    }),
    deletePromo: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/promo/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Promo'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetAdminEventsQuery,
  useGetAdminEventDetailQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useUpdateEventStatusMutation,
  useSetupZonesMutation,
  useDeleteEventMutation,
  useGetVenuesQuery,
  useCreateVenueMutation,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
  useGetAdminUsersQuery,
  useToggleBanUserMutation,
  useGetAdminBookingsQuery,
  useRefundBookingMutation,
  useGetRevenueChartQuery,
  useGetSeatFillStatsQuery,
  useGetDemographicsQuery,
  useGetConversionFunnelQuery,
  useGetPeakHoursQuery,
  useGetAuditLogsQuery,
  useGetUserDetailQuery,
  useGetAdminBookingsFilteredQuery,
  useGetPromosQuery,
  useCreatePromoMutation,
  useTogglePromoMutation,
  useUpdatePromoMutation,
  useDeletePromoMutation,
} = adminApi;
