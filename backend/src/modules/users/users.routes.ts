import { Router } from 'express';
import argon2 from 'argon2';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth.middleware';
import { User } from '../../models/User';
import { apiResponse } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler.middleware';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, _file, cb) => {
    const ext = path.extname(_file.originalname).toLowerCase() || '.jpg';
    cb(null, `user_${(req as Express.Request & { user?: { id: number } }).user?.id}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF'));
  },
});

const router = Router();

// Upload avatar
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Không có file được upload', 400);

    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    // Xóa avatar cũ nếu là file local
    if (user.avatar_url?.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), user.avatar_url);
      fs.unlink(oldPath, () => {}); // bất đồng bộ, bỏ qua lỗi
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatar_url: avatarUrl });

    apiResponse.success(res, { avatarUrl }, 'Cập nhật ảnh đại diện thành công');
  } catch (err) { next(err); }
});

// Lấy profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ['password_hash', 'email_verify_token'] },
    });
    apiResponse.success(res, user);
  } catch (err) { next(err); }
});

// Cập nhật profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { fullName, phone, dateOfBirth, gender } = req.body;
    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await user.update({
      ...(fullName !== undefined && { full_name: fullName }),
      ...(phone !== undefined && { phone }),
      ...(dateOfBirth !== undefined && { date_of_birth: dateOfBirth || null }),
      ...(gender !== undefined && { gender: gender || null }),
    });

    apiResponse.success(res, {
      id: user.id, email: user.email, fullName: user.full_name,
      role: user.role, emailVerified: user.email_verified, avatarUrl: user.avatar_url,
      gender: user.gender,
      dateOfBirth: user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : null,
    }, 'Cập nhật hồ sơ thành công');
  } catch (err) { next(err); }
});

// Đổi mật khẩu
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new AppError('Thiếu thông tin', 400);
    if (newPassword.length < 8) throw new AppError('Mật khẩu mới tối thiểu 8 ký tự', 400);

    const user = await User.findByPk(req.user!.id);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);
    if (!user.password_hash) throw new AppError('Tài khoản này đăng nhập bằng Google', 400);

    const valid = await argon2.verify(user.password_hash, currentPassword);
    if (!valid) throw new AppError('Mật khẩu hiện tại không đúng', 401);

    const newHash = await argon2.hash(newPassword);
    await user.update({ password_hash: newHash });

    apiResponse.success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) { next(err); }
});

// Cập nhật cài đặt thông báo (lưu phía client — backend nhận và xác nhận)
router.put('/notification-settings', authenticate, async (_req, res) => {
  apiResponse.success(res, null, 'Cập nhật cài đặt thông báo thành công');
});

// Trả về profile đầy đủ kèm gender + dateOfBirth cho me endpoint
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ['password_hash', 'email_verify_token'] },
    });
    apiResponse.success(res, user);
  } catch (err) { next(err); }
});

export default router;
