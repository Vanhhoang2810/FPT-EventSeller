import { Router } from 'express';
import { ChatConversation } from '../../models/ChatConversation';
import { ChatMessage } from '../../models/ChatMessage';
import { User } from '../../models/User';
import { authenticate, requireAdmin, optionalAuth } from '../../middleware/auth.middleware';
import { apiResponse } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getIO } from '../../config/socket';
import { Op } from 'sequelize';

const router = Router();

// ── CUSTOMER ROUTES ──────────────────────────────────────────

// Bắt đầu / lấy conversation hiện tại của visitor/user
router.post('/conversations', async (req, res, next) => {
  try {
    const { visitorId, visitorName, visitorEmail, userId } = req.body;
    if (!visitorId && !userId) throw new AppError('Thiếu visitor ID', 400);

    const where = userId
      ? { user_id: userId, status: { [Op.in]: ['open', 'in_progress'] }, deleted_by_user: false }
      : { visitor_id: visitorId, status: { [Op.in]: ['open', 'in_progress'] }, deleted_by_user: false };

    let conv = await ChatConversation.findOne({ where });
    if (!conv) {
      conv = await ChatConversation.create({
        user_id: userId || null,
        visitor_id: visitorId || null,
        visitor_name: visitorName || null,
        visitor_email: visitorEmail || null,
        status: 'open',
      });
      try {
        getIO().to('admin:dashboard').emit('chat:new_conversation', {
          id: conv.id,
          visitorName: visitorName || 'Khách',
          status: 'open',
          createdAt: conv.created_at,
        });
      } catch { /* optional */ }
    }

    // Fix 2: trả về unread_user để ChatWidget seed badge khi refresh
    apiResponse.success(res, { conversationId: conv.id, status: conv.status, unread_user: conv.unread_user });
  } catch (err) { next(err); }
});

// Lấy messages của 1 conversation (customer) — pure, không side effect
router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { conversation_id: Number(req.params.id) },
      order: [['created_at', 'ASC']],
    });
    apiResponse.success(res, messages);
  } catch (err) { next(err); }
});

// User/visitor đánh dấu đã đọc tin nhắn của admin
router.put('/conversations/:id/messages/read', async (req, res, next) => {
  try {
    const convId = Number(req.params.id);
    await ChatMessage.update(
      { is_read: true },
      { where: { conversation_id: convId, sender_type: 'admin', is_read: false } },
    );
    await ChatConversation.update({ unread_user: 0 }, { where: { id: convId } });

    try {
      getIO().to('admin:dashboard').emit('chat:messages_read', { conversationId: convId });
    } catch { /* optional */ }

    apiResponse.success(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) { next(err); }
});

// Gửi message (customer)
// optionalAuth: verify JWT nếu có — dùng req.user.id thay vì tin vào senderId từ body
router.post('/conversations/:id/messages', optionalAuth, async (req, res, next) => {
  try {
    const { content, senderId, senderName, visitorId } = req.body;
    if (!content?.trim()) throw new AppError('Nội dung tin nhắn không được rỗng', 400);

    const conv = await ChatConversation.findByPk(Number(req.params.id));
    if (!conv) throw new AppError('Cuộc trò chuyện không tồn tại', 404);

    if (conv.user_id) {
      // User đã đăng nhập — dùng JWT thay vì tin vào senderId từ body
      const jwtUserId = req.user?.id;
      if (jwtUserId ? jwtUserId !== conv.user_id : (!senderId || String(senderId) !== String(conv.user_id))) {
        throw new AppError('Không có quyền gửi tin nhắn', 403);
      }
    } else {
      if (!visitorId || visitorId !== conv.visitor_id) {
        throw new AppError('Không có quyền gửi tin nhắn', 403);
      }
    }

    const wasClosedBefore = conv.status === 'closed';

    const msg = await ChatMessage.create({
      conversation_id: conv.id,
      sender_type: req.user?.id ? 'user' : 'visitor', // dùng auth state, không tin body
      sender_id: req.user?.id ?? (senderId || null),
      sender_name: senderName || 'Khách',
      content: content.trim(),
    });

    await conv.update({
      last_message_at: new Date(),
      unread_admin: conv.unread_admin + 1,
      status: wasClosedBefore ? 'open' : conv.status,
    });

    // Fix 9: emit khi conv được mở lại từ trạng thái closed
    if (wasClosedBefore) {
      try {
        getIO().to(`chat:${conv.id}`).emit('chat:status_changed', { conversationId: conv.id, status: 'open' });
        getIO().to('admin:dashboard').emit('chat:status_changed', { conversationId: conv.id, status: 'open' });
      } catch { /* optional */ }
    }

    try {
      getIO().to('admin:dashboard').emit('chat:message', {
        conversationId: conv.id,
        message: msg.toJSON(),
      });
    } catch { /* optional */ }

    try {
      getIO().to(`chat:${conv.id}`).emit('chat:message', {
        conversationId: conv.id,
        message: msg.toJSON(),
      });
    } catch { /* optional */ }

    apiResponse.success(res, msg);
  } catch (err) { next(err); }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────

// Lấy tất cả conversations — Fix 7: lọc deleted_by_user
router.get('/admin/conversations', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const where: Record<string, unknown> = { deleted_by_user: false };
    if (status && status !== 'all') where.status = status;

    const convs = await ChatConversation.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'avatar_url'] },
      ],
      order: [['last_message_at', 'DESC'], ['created_at', 'DESC']],
    });
    apiResponse.success(res, convs);
  } catch (err) { next(err); }
});

// Lấy messages (admin) — Fix read-receipt trigger: thuần fetch, không mark-as-read ở đây
router.get('/admin/conversations/:id/messages', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { conversation_id: Number(req.params.id) },
      order: [['created_at', 'ASC']],
    });
    apiResponse.success(res, messages);
  } catch (err) { next(err); }
});

// Admin reply — Fix 8: emit tới admin:dashboard để multi-tab admin đồng bộ
router.post('/admin/conversations/:id/messages', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw new AppError('Nội dung tin nhắn không được rỗng', 400);

    const conv = await ChatConversation.findByPk(Number(req.params.id));
    if (!conv) throw new AppError('Cuộc trò chuyện không tồn tại', 404);

    // full_name không có trong JWT — fetch từ DB để hiện tên admin chính xác
    const adminUser = await User.findByPk(req.user!.id, { attributes: ['full_name'] });
    const msg = await ChatMessage.create({
      conversation_id: conv.id,
      sender_type: 'admin',
      sender_id: req.user!.id,
      sender_name: adminUser?.full_name ?? 'Admin',
      content: content.trim(),
    });

    await conv.update({
      last_message_at: new Date(),
      unread_user: conv.unread_user + 1,
      status: 'in_progress',
    });

    // Broadcast cho customer
    try {
      getIO().to(`chat:${conv.id}`).emit('chat:message', {
        conversationId: conv.id,
        message: msg.toJSON(),
      });
    } catch { /* optional */ }

    // Fix 8: broadcast cho các tab admin khác
    try {
      getIO().to('admin:dashboard').emit('chat:message', {
        conversationId: conv.id,
        message: msg.toJSON(),
      });
    } catch { /* optional */ }

    apiResponse.success(res, msg);
  } catch (err) { next(err); }
});

// Admin: bulk actions (mark-read / delete)
router.post('/admin/conversations/bulk', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { ids, action } = req.body as { ids: number[]; action: 'mark_read' | 'delete' };
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('Danh sách ID không hợp lệ', 400);

    if (action === 'mark_read') {
      await ChatConversation.update({ unread_admin: 0 }, { where: { id: ids } });
      await ChatMessage.update(
        { is_read: true },
        { where: { conversation_id: ids, sender_type: { [Op.in]: ['user', 'visitor'] } } },
      );
      apiResponse.success(res, null, `Đã đánh dấu đã đọc ${ids.length} cuộc trò chuyện`);
    } else if (action === 'delete') {
      await ChatMessage.destroy({ where: { conversation_id: ids } });
      await ChatConversation.destroy({ where: { id: ids } });
      apiResponse.success(res, null, `Đã xóa ${ids.length} cuộc trò chuyện`);
    } else {
      throw new AppError('Action không hợp lệ', 400);
    }
  } catch (err) { next(err); }
});

// Admin: đánh dấu 1 conversation đã đọc — Fix read-receipt: emit socket tại đây
router.put('/admin/conversations/:id/read', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const convId = Number(req.params.id);
    await ChatConversation.update({ unread_admin: 0 }, { where: { id: convId } });
    await ChatMessage.update(
      { is_read: true },
      { where: { conversation_id: convId, sender_type: ['user', 'visitor'] } },
    );
    // Thông báo customer rằng admin đã đọc → ✓✓
    try {
      getIO().to(`chat:${convId}`).emit('chat:messages_read', { conversationId: convId });
    } catch { /* optional */ }
    apiResponse.success(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) { next(err); }
});

// Fix 1: đánh dấu 1 conversation chưa đọc (set unread_admin = 1)
router.put('/admin/conversations/:id/unread', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ChatConversation.update({ unread_admin: 1 }, { where: { id: Number(req.params.id) } });
    apiResponse.success(res, null, 'Đã đánh dấu chưa đọc');
  } catch (err) { next(err); }
});

// Admin: xóa conversation
router.delete('/admin/conversations/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const conv = await ChatConversation.findByPk(Number(req.params.id));
    if (!conv) throw new AppError('Cuộc trò chuyện không tồn tại', 404);
    await ChatMessage.destroy({ where: { conversation_id: conv.id } });
    await conv.destroy();
    apiResponse.success(res, null, 'Đã xóa cuộc trò chuyện');
  } catch (err) { next(err); }
});

// Admin đổi status — Fix 9: emit chat:status_changed tới customer
router.put('/admin/conversations/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const conv = await ChatConversation.findByPk(Number(req.params.id));
    if (!conv) throw new AppError('Cuộc trò chuyện không tồn tại', 404);
    await conv.update({ status: req.body.status });
    try {
      getIO().to(`chat:${conv.id}`).emit('chat:status_changed', {
        conversationId: conv.id,
        status: req.body.status,
      });
    } catch { /* optional */ }
    apiResponse.success(res, conv);
  } catch (err) { next(err); }
});

// ── RECALL & DELETE (customer) ────────────────────────────────

// Thu hồi tin nhắn (user/visitor tự thu hồi)
router.delete('/conversations/:convId/messages/:msgId', optionalAuth, async (req, res, next) => {
  try {
    const msg = await ChatMessage.findOne({
      where: { id: Number(req.params.msgId), conversation_id: Number(req.params.convId) },
    });
    if (!msg) throw new AppError('Tin nhắn không tồn tại', 404);
    if (msg.is_recalled) throw new AppError('Tin nhắn đã được thu hồi', 400);

    if (msg.sender_type === 'admin') throw new AppError('Không thể thu hồi tin nhắn của admin', 403);
    const { senderId, visitorId } = req.body;
    if (msg.sender_type === 'user' && msg.sender_id) {
      const jwtUserId = req.user?.id;
      const effectiveId = jwtUserId ?? Number(senderId);
      if (effectiveId !== msg.sender_id) throw new AppError('Không có quyền thu hồi tin nhắn này', 403);
    }
    if (msg.sender_type === 'visitor') {
      const conv = await ChatConversation.findByPk(msg.conversation_id);
      if (!conv || !visitorId || conv.visitor_id !== visitorId) {
        throw new AppError('Không có quyền thu hồi tin nhắn này', 403);
      }
    }

    const fiveMin = 5 * 60 * 1000;
    if (Date.now() - new Date(msg.created_at!).getTime() > fiveMin) {
      throw new AppError('Chỉ có thể thu hồi tin nhắn trong 5 phút', 400);
    }

    await msg.update({ is_recalled: true });

    try {
      const io = getIO();
      io.to(`chat:${msg.conversation_id}`).emit('chat:recalled', { messageId: msg.id });
      io.to('admin:dashboard').emit('chat:recalled', { conversationId: msg.conversation_id, messageId: msg.id });
    } catch { /* optional */ }

    apiResponse.success(res, null, 'Đã thu hồi tin nhắn');
  } catch (err) { next(err); }
});

// Xóa cuộc hội thoại phía user (soft delete)
router.delete('/conversations/:id', optionalAuth, async (req, res, next) => {
  try {
    const { visitorId, userId } = req.query;
    // Ưu tiên JWT user.id thay vì userId từ query (tránh IDOR)
    const resolvedUserId = req.user?.id ?? (userId ? Number(userId) : undefined);
    const where = resolvedUserId
      ? { id: Number(req.params.id), user_id: resolvedUserId }
      : { id: Number(req.params.id), visitor_id: String(visitorId) };

    const conv = await ChatConversation.findOne({ where: where as Record<string, unknown> });
    if (!conv) throw new AppError('Cuộc trò chuyện không tồn tại', 404);

    await conv.update({ deleted_by_user: true, status: 'closed' });
    apiResponse.success(res, null, 'Đã xóa cuộc trò chuyện');
  } catch (err) { next(err); }
});

// ── ADMIN RECALL ──────────────────────────────────────────────

router.delete('/admin/conversations/:convId/messages/:msgId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const msg = await ChatMessage.findOne({
      where: { id: Number(req.params.msgId), conversation_id: Number(req.params.convId) },
    });
    if (!msg) throw new AppError('Tin nhắn không tồn tại', 404);
    if (msg.is_recalled) throw new AppError('Tin nhắn đã được thu hồi', 400);

    await msg.update({ is_recalled: true });

    try {
      const io = getIO();
      io.to(`chat:${msg.conversation_id}`).emit('chat:recalled', { messageId: msg.id });
      io.to('admin:dashboard').emit('chat:recalled', { conversationId: msg.conversation_id, messageId: msg.id });
    } catch { /* optional */ }

    apiResponse.success(res, null, 'Đã thu hồi tin nhắn');
  } catch (err) { next(err); }
});

export default router;
