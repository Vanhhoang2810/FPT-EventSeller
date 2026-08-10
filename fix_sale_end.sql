-- Fix sale_end_time = 2 giờ trước start_time (hợp lý hơn)
UPDATE events SET
  sale_end_time = DATE_SUB(start_time, INTERVAL 2 HOUR),
  updated_at = NOW()
WHERE id IN (1,2,3,4,5,6,7);

-- Xác nhận kết quả cuối
SELECT id, title, DATE(start_time) as event_date, sale_end_time, status
FROM events
ORDER BY id;
