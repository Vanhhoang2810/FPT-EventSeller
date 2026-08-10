-- Tắt queue_enabled cho tất cả events để không yêu cầu token hàng đợi
UPDATE events SET queue_enabled = 0, updated_at = NOW() WHERE id IN (1,2,3,4,5,6,7);

-- Xác nhận
SELECT id, title, queue_enabled, status FROM events ORDER BY id;
