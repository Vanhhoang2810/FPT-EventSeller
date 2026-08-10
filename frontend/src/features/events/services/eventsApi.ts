import { apiSlice } from '../../../app/api';

export interface EventVenue {
  id: number;
  name: string;
  city: string;
}

export interface EventZone {
  id: number;
  name: string;
  type: 'seated' | 'standing';
  price: number;
  color_code: string;
  rows_count: number;
  seats_per_row: number;
  sort_order: number;
}

export interface EventSeat {
  id: number;
  row_label: string;
  seat_number: number;
  status: 'available' | 'locked' | 'sold' | 'disabled';
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  banner_url?: string;
  thumbnail_url?: string;
  category: string;
  venue_id: number;
  start_time: string;
  end_time: string;
  sale_start_time: string;
  sale_end_time?: string;
  status: 'draft' | 'published' | 'on_sale' | 'sold_out' | 'completed' | 'cancelled';
  max_tickets_per_user: number;
  queue_enabled: boolean;
  venue?: EventVenue;
  zones?: (EventZone & { seats?: EventSeat[] })[];
  minPrice?: number;
  isFavorite?: boolean;
}

export interface EventsListResponse {
  success: boolean;
  data: Event[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface SeatMapResponse {
  success: boolean;
  data: { eventId: number; zones: (EventZone & { seats: EventSeat[] })[] };
}

export const eventsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<EventsListResponse, Record<string, string | number | undefined>>({
      query: (params = {}) => ({
        url: '/events',
        params,
      }),
      providesTags: ['Event'],
    }),

    getFeaturedEvents: builder.query<{ success: boolean; data: { onSale: Event[]; upcoming: Event[] } }, void>({
      query: () => '/events/featured',
      providesTags: ['Event'],
    }),

    getTrendingEvents: builder.query<{ success: boolean; data: Event[] }, void>({
      query: () => '/events/trending',
      providesTags: ['Event'],
    }),

    getEventSuggestions: builder.query<{ success: boolean; data: Event[] }, string>({
      query: (q) => ({ url: '/events/suggestions', params: { q } }),
    }),

    getEventDetail: builder.query<{ success: boolean; data: Event }, string>({
      query: (slugOrId) => `/events/${slugOrId}`,
      providesTags: (_result, _err, slug) => [{ type: 'Event', id: slug }],
    }),

    getEventSeatMap: builder.query<SeatMapResponse, number>({
      query: (id) => `/events/${id}/seat-map`,
      providesTags: (_r, _e, id) => [{ type: 'Event' as const, id: `seatmap-${id}` }],
    }),

    toggleFavorite: builder.mutation<{ success: boolean; data: { isFavorite: boolean } }, number>({
      query: (id) => ({ url: `/events/${id}/favorite`, method: 'POST' }),
      invalidatesTags: ['Event', 'Favorite'],
    }),

    remindEvent: builder.mutation<{ success: boolean; data: { reminded: boolean } }, number>({
      query: (id) => ({ url: `/events/${id}/remind`, method: 'POST' }),
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetFeaturedEventsQuery,
  useGetTrendingEventsQuery,
  useGetEventSuggestionsQuery,
  useGetEventDetailQuery,
  useGetEventSeatMapQuery,
  useToggleFavoriteMutation,
  useRemindEventMutation,
} = eventsApi;
