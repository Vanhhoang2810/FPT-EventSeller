import { apiSlice } from '../../../app/api';

export interface Ticket {
  id: number;
  booking_id: number;
  seat_id: number;
  user_id: number;
  event_id: number;
  qr_code: string;
  status: 'active' | 'used' | 'cancelled';
  used_at?: string;
  created_at: string;
  seat?: { row_label: string; seat_number: number; zone?: { name: string; color_code: string; price: number } };
  event?: { id: number; title: string; slug: string; banner_url?: string; thumbnail_url?: string; start_time: string; end_time: string; status: string; venue?: { name: string; city: string } };
}

export const ticketsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyTickets: builder.query<
      { success: boolean; data: Ticket[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { status?: string; page?: number }
    >({
      query: (params = {}) => ({ url: '/tickets', params }),
      providesTags: ['Ticket'],
    }),

    getTicketDetail: builder.query<{ success: boolean; data: Ticket }, number>({
      query: (id) => `/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Ticket', id }],
    }),
  }),
});

export const { useGetMyTicketsQuery, useGetTicketDetailQuery } = ticketsApi;
