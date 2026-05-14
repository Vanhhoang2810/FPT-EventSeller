import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { PromoCode } from '../../models/PromoCode';
import { PromoUsage } from '../../models/PromoUsage';
import { apiResponse } from '../../utils/apiResponse';
import { Op } from 'sequelize';
import { AppError } from '../../middleware/errorHandler.middleware';

const router = Router();

// Validate promo code (customer)
router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    const now = new Date();
    const promo = await PromoCode.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        starts_at: { [Op.lte]: now },
        expires_at: { [Op.gte]: now },
      },
    });

    if (!promo) { apiResponse.badRequest(res, 'Mã giảm giá không hợp lệ'); return; }
    if (Number(promo.min_amount) > amount) {
      apiResponse.badRequest(res, `Đơn tối thiểu ${promo.min_amount.toLocaleString('vi-VN')}₫`);
      return;
    }
    // H1: kiểm tra usage_limit để tránh báo valid rồi reject ở checkout
    if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
      apiResponse.badRequest(res, 'Mã giảm giá đã hết lượt sử dụng'); return;
    }
    // H2: kiểm tra per_user_limit
    const userUsage = await PromoUsage.count({ where: { promo_id: promo.id, user_id: req.user!.id } });
    if (userUsage >= promo.per_user_limit) {
      apiResponse.badRequest(res, 'Bạn đã dùng hết lượt sử dụng mã này'); return;
    }

    let discount: number;
    if (promo.discount_type === 'percentage') {
      discount = Math.floor((amount * Number(promo.discount_value)) / 100);
      if (promo.max_discount !== null) discount = Math.min(discount, Number(promo.max_discount));
    } else {
      discount = Number(promo.discount_value);
    }

    apiResponse.success(res, { code: promo.code, discountType: promo.discount_type, discountValue: promo.discount_value, discountAmount: discount });
  } catch (err) { next(err); }
});

// Admin: list promo codes
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const promos = await PromoCode.findAll({ order: [['created_at', 'DESC']] });
    apiResponse.success(res, promos);
  } catch (err) { next(err); }
});

// Admin: create promo code
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const promo = await PromoCode.create({
      code: req.body.code.toUpperCase(),
      discount_type: req.body.discountType,
      discount_value: req.body.discountValue,
      max_discount: req.body.maxDiscount || null,
      event_id: req.body.eventId || null,
      usage_limit: req.body.usageLimit || null,
      usage_count: 0,
      per_user_limit: req.body.perUserLimit || 1,
      min_amount: req.body.minAmount || 0,
      starts_at: new Date(req.body.startsAt),
      expires_at: new Date(req.body.expiresAt),
      is_active: true,
      created_by: req.user!.id,
    });
    apiResponse.created(res, promo, 'Tạo mã giảm giá thành công');
  } catch (err) { next(err); }
});

// Admin: toggle active
router.put('/:id/toggle', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const promo = await PromoCode.findByPk(Number(req.params.id));
    if (!promo) throw new AppError('Mã không tồn tại', 404);
    await promo.update({ is_active: !promo.is_active });
    apiResponse.success(res, promo);
  } catch (err) { next(err); }
});

// Admin: update promo code
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const promo = await PromoCode.findByPk(Number(req.params.id));
    if (!promo) throw new AppError('Mã không tồn tại', 404);
    await promo.update({
      ...(req.body.discountType  !== undefined && { discount_type:  req.body.discountType }),
      ...(req.body.discountValue !== undefined && { discount_value:  req.body.discountValue }),
      ...(req.body.usageLimit    !== undefined && { usage_limit:     req.body.usageLimit ?? null }),
      ...(req.body.perUserLimit  !== undefined && { per_user_limit:  Math.max(1, Number(req.body.perUserLimit)) }),
      ...(req.body.minAmount     !== undefined && { min_amount:      req.body.minAmount }),
      ...(req.body.startsAt      !== undefined && { starts_at:       new Date(req.body.startsAt) }),
      ...(req.body.expiresAt     !== undefined && { expires_at:      new Date(req.body.expiresAt) }),
    });
    apiResponse.success(res, promo, 'Cập nhật mã giảm giá thành công');
  } catch (err) { next(err); }
});

// Admin: delete promo code
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const promo = await PromoCode.findByPk(Number(req.params.id));
    if (!promo) throw new AppError('Mã không tồn tại', 404);
    if (promo.usage_count > 0) throw new AppError('Không thể xóa mã đã được sử dụng', 400);
    await promo.destroy();
    apiResponse.success(res, null, 'Đã xóa mã giảm giá');
  } catch (err) { next(err); }
});

export default router;
