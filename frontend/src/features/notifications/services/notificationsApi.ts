import { apiSlice } from '../../../app/api';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { success: boolean; data: Notification[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      void
    >({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<{ success: boolean; data: { count: number } }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    markRead: builder.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),

    markAllRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} = notificationsApi;
