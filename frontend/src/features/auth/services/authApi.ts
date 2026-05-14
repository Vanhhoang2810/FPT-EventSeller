import { apiSlice } from '../../../app/api';
import type { AuthUser } from '../store/authSlice';

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  isNew?: boolean;
}

// Wrapper thực tế từ backend: { success, data: AuthResponse, message }
interface ApiWrapper<T> {
  success: boolean;
  data: T;
  message: string;
}

interface RegisterBody {
  email: string;
  password: string;
  fullName: string;
  turnstileToken?: string;
}

interface LoginBody {
  email: string;
  password: string;
  rememberMe?: boolean;
  turnstileToken?: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterBody>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      // Unwrap data để result.accessToken và result.user luôn đúng
      transformResponse: (res: ApiWrapper<AuthResponse>) => res.data,
    }),

    login: builder.mutation<AuthResponse, LoginBody>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (res: ApiWrapper<AuthResponse>) => res.data,
    }),

    googleAuth: builder.mutation<AuthResponse & { isNew: boolean }, { googleIdToken: string }>({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
      transformResponse: (res: ApiWrapper<AuthResponse & { isNew: boolean }>) => res.data,
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),

    getMe: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      transformResponse: (response: { data: AuthUser }) => response.data,
      providesTags: ['User'],
    }),

    verifyEmail: builder.mutation<void, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),

    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),

    resetPassword: builder.mutation<void, { token: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),

    resendVerification: builder.mutation<void, void>({
      query: () => ({ url: '/auth/resend-verification', method: 'POST' }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGoogleAuthMutation,
  useLogoutMutation,
  useGetMeQuery,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useResendVerificationMutation,
} = authApi;
