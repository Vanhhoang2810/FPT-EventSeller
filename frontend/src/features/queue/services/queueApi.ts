import { apiSlice } from '../../../app/api';

export interface QueuePosition {
  position: number;
  estimatedWait: number;
  isActive: boolean;
}

export const queueApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    joinQueue: builder.mutation<{ success: boolean; data: QueuePosition }, number>({
      query: (eventId) => ({ url: `/queue/events/${eventId}/join`, method: 'POST' }),
    }),
    getQueuePosition: builder.query<{ success: boolean; data: QueuePosition }, number>({
      query: (eventId) => `/queue/events/${eventId}/position`,
    }),
    getQueueStats: builder.query<
      { success: boolean; data: { queueLength: number; activeCount: number; isEnabled: boolean } },
      number
    >({
      query: (eventId) => `/queue/events/${eventId}/stats`,
    }),
  }),
});

export const { useJoinQueueMutation, useGetQueuePositionQuery, useGetQueueStatsQuery } = queueApi;
