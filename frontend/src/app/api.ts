import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import { setCredentials, clearCredentials } from '../features/auth/store/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Mutex — chỉ cho phép 1 refresh request tại một thời điểm
// Tránh race condition khi nhiều request cùng nhận 401
let refreshPromise: Promise<boolean> | null = null;

const doRefresh = async (api: Parameters<BaseQueryFn>[1], extraOptions: Parameters<BaseQueryFn>[2]): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const { accessToken, user } = (refreshResult.data as { accessToken: string; user?: unknown });
        api.dispatch(setCredentials({ accessToken, user: user as never }));
        return true;
      }

      api.dispatch(clearCredentials());
      return false;
    } catch {
      api.dispatch(clearCredentials());
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshed = await doRefresh(api, extraOptions);
    if (refreshed) {
      // Retry request gốc sau khi refresh thành công
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Event', 'Booking', 'Ticket', 'Notification', 'Favorite', 'Promo', 'Chat'],
  endpoints: () => ({}),
});
