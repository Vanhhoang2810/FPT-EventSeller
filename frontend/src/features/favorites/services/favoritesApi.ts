import { apiSlice } from '../../../app/api';
import type { Event } from '../../events/services/eventsApi';

export const favoritesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFavorites: builder.query<{ success: boolean; data: Event[] }, void>({
      query: () => '/events/favorites',
      providesTags: ['Favorite'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetFavoritesQuery } = favoritesApi;
