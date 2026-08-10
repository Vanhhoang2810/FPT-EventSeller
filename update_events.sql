-- Dịch chuyển tất cả sự kiện sang tháng 9-10/2026 và reset về on_sale
UPDATE events SET
  start_time      = DATE_ADD(start_time,      INTERVAL 4 MONTH),
  end_time        = DATE_ADD(end_time,        INTERVAL 4 MONTH),
  sale_start_time = '2026-08-09 00:00:00',
  sale_end_time   = DATE_ADD(end_time,        INTERVAL 4 MONTH),
  status          = 'on_sale',
  updated_at      = NOW()
WHERE id IN (1,2,3,4,5,6,7);

-- Xác nhận kết quả
SELECT id, title, DATE(start_time) as start_date, DATE(sale_end_time) as sale_end, status
FROM events
ORDER BY id;
