import { apiSlice } from '../../../app/api';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: 'user' | 'admin' | 'visitor';
  sender_id: number | null;
  sender_name: string | null;
  content: string;
  is_read: boolean;
  is_recalled: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  user_id: number | null;
  visitor_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  status: 'open' | 'in_progress' | 'closed';
  unread_admin: number;
  unread_user: number;
  last_message_at: string | null;
  created_at: string;
  user?: { id: number; full_name: string; email: string; avatar_url?: string };
}

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fix 2: response thêm unread_user
    startConversation: builder.mutation<
      { success: boolean; data: { conversationId: number; status: string; unread_user: number } },
      { visitorId?: string; visitorName?: string; visitorEmail?: string; userId?: number }
    >({
      query: (body) => ({ url: '/chat/conversations', method: 'POST', body }),
    }),

    getChatMessages: builder.query<{ success: boolean; data: ChatMessage[] }, number>({
      query: (convId) => `/chat/conversations/${convId}/messages`,
      providesTags: (_r, _e, id) => [{ type: 'Chat' as const, id }],
    }),

    // Fix 4: thêm visitorId để backend kiểm tra ownership
    sendMessage: builder.mutation<{ success: boolean; data: ChatMessage }, {
      conversationId: number; content: string;
      senderType?: string; senderId?: number; senderName?: string; visitorId?: string;
    }>({
      query: ({ conversationId, ...body }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        method: 'POST', body,
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [{ type: 'Chat' as const, id: conversationId }],
    }),

    // Admin endpoints
    getAdminConversations: builder.query<{ success: boolean; data: ChatConversation[] }, string | void>({
      query: (status) => `/chat/admin/conversations${status && status !== 'all' ? `?status=${status}` : ''}`,
      providesTags: [{ type: 'Chat' as const, id: 'LIST' }],
    }),

    getAdminMessages: builder.query<{ success: boolean; data: ChatMessage[] }, number>({
      query: (convId) => `/chat/admin/conversations/${convId}/messages`,
      providesTags: (_r, _e, id) => [{ type: 'Chat' as const, id }],
    }),

    adminReply: builder.mutation<{ success: boolean; data: ChatMessage }, {
      conversationId: number; content: string;
    }>({
      query: ({ conversationId, content }) => ({
        url: `/chat/admin/conversations/${conversationId}/messages`,
        method: 'POST', body: { content },
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Chat' as const, id: conversationId },
        { type: 'Chat' as const, id: 'LIST' },
      ],
    }),

    updateConversationStatus: builder.mutation<{ success: boolean }, {
      id: number; status: 'open' | 'in_progress' | 'closed';
    }>({
      query: ({ id, status }) => ({
        url: `/chat/admin/conversations/${id}/status`,
        method: 'PUT', body: { status },
      }),
      invalidatesTags: [{ type: 'Chat' as const, id: 'LIST' }],
    }),

    deleteConversation: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/chat/admin/conversations/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Chat' as const, id: 'LIST' }],
    }),

    markAdminMessagesRead: builder.mutation<{ success: boolean }, number>({
      query: (convId) => ({ url: `/chat/conversations/${convId}/messages/read`, method: 'PUT' }),
    }),

    recallMessage: builder.mutation<{ success: boolean }, { convId: number; msgId: number }>({
      query: ({ convId, msgId }) => ({
        url: `/chat/conversations/${convId}/messages/${msgId}`,
        method: 'DELETE',
      }),
    }),

    deleteMyConversation: builder.mutation<{ success: boolean }, {
      id: number; visitorId?: string; userId?: number;
    }>({
      query: ({ id, visitorId, userId }) => {
        const params = userId ? `userId=${userId}` : `visitorId=${visitorId}`;
        return { url: `/chat/conversations/${id}?${params}`, method: 'DELETE' };
      },
    }),

    markConversationRead: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/chat/admin/conversations/${id}/read`, method: 'PUT' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Chat' as const, id }, { type: 'Chat' as const, id: 'LIST' }],
    }),

    // Fix 1: endpoint đánh dấu chưa đọc
    markConversationUnread: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/chat/admin/conversations/${id}/unread`, method: 'PUT' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Chat' as const, id }, { type: 'Chat' as const, id: 'LIST' }],
    }),

    bulkAction: builder.mutation<{ success: boolean }, { ids: number[]; action: 'mark_read' | 'delete' }>({
      query: (body) => ({ url: '/chat/admin/conversations/bulk', method: 'POST', body }),
      invalidatesTags: [{ type: 'Chat' as const, id: 'LIST' }],
    }),

    adminRecallMessage: builder.mutation<{ success: boolean }, { convId: number; msgId: number }>({
      query: ({ convId, msgId }) => ({
        url: `/chat/admin/conversations/${convId}/messages/${msgId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useStartConversationMutation,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useGetAdminConversationsQuery,
  useGetAdminMessagesQuery,
  useAdminReplyMutation,
  useUpdateConversationStatusMutation,
  useDeleteConversationMutation,
  useMarkAdminMessagesReadMutation,
  useRecallMessageMutation,
  useDeleteMyConversationMutation,
  useAdminRecallMessageMutation,
  useMarkConversationReadMutation,
  useMarkConversationUnreadMutation,
  useBulkActionMutation,
} = chatApi;
