import { apiSlice } from '../../../app/api';

export interface BookingSeat {
  id: number;
  seat_id: number;
  price: number;
  seat?: {
    row_label: string;
    seat_number: number;
    zone?: { name: string; color_code: string };
  };
}

export interface Booking {
  id: number;
  user_id: number;
  event_id: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  total_amount: number;
  seat_count: number;
  expires_at: string;
  discount_amount: number;
  confirmed_at?: string;
  bookingSeats?: BookingSeat[];
  event?: { title: string; slug: string; start_time: string; banner_url?: string };
  payment?: { method: string; status: string; amount: number };
}

export const bookingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    lockSeats: builder.mutation<
      { success: boolean; data: { bookingId: number; expiresAt: string }; message: string },
      { eventId: number; seatIds?: number[]; standingSelections?: { zoneId: number; quantity: number }[]; queueToken?: string }
    >({
      query: ({ queueToken, ...body }) => ({
        url: '/bookings/lock-seats',
        method: 'POST',
        body,
        headers: queueToken ? { 'x-queue-token': queueToken } : undefined,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: 'Event' as const, id: `seatmap-${eventId}` }],
    }),

    getBooking: builder.query<{ success: boolean; data: Booking }, number>({
      query: (id) => `/bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),

    checkout: builder.mutation<
      { success: boolean; data: unknown; message: string },
      { bookingId: number; method: string; promoCode?: string }
    >({
      query: ({ bookingId, ...body }) => ({ url: `/bookings/${bookingId}/checkout`, method: 'POST', body }),
      invalidatesTags: ['Booking'],
    }),

    cancelBooking: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Booking'],
    }),

    requestCancellation: builder.mutation<{ success: boolean }, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/request-cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Ticket'],
    }),

    getMyPendingBooking: builder.query<
      { success: boolean; data: { bookingId: number } | null },
      number
    >({
      query: (eventId) => `/bookings/pending?eventId=${eventId}`,
      providesTags: ['Booking'],
    }),

    createVnPayUrl: builder.mutation<{ success: boolean; data: { url: string } }, number>({
      query: (bookingId) => ({ url: `/payments/${bookingId}/vnpay/create`, method: 'POST' }),
    }),

    createMoMoPayment: builder.mutation<{ success: boolean; data: { payUrl?: string } }, number>({
      query: (bookingId) => ({ url: `/payments/${bookingId}/momo/create`, method: 'POST' }),
    }),

    // Thanh toán giả lập — confirm ngay lập tức, lưu đúng method (vnpay/momo/simulated)
    simulatePayment: builder.mutation<
      { success: boolean; data: { bookingId: number; transactionId: string; method: string } },
      { bookingId: number; method: string }
    >({
      query: ({ bookingId, method }) => ({
        url: `/payments/${bookingId}/simulate`,
        method: 'POST',
        body: { method },
      }),
      invalidatesTags: ['Booking'],
    }),
  }),
});

export const {
  useLockSeatsMutation,
  useGetBookingQuery,
  useCheckoutMutation,
  useCancelBookingMutation,
  useCreateVnPayUrlMutation,
  useCreateMoMoPaymentMutation,
  useSimulatePaymentMutation,
  useGetMyPendingBookingQuery,
  useRequestCancellationMutation,
} = bookingApi;
