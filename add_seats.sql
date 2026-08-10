-- ============================================================
-- Thêm zones + seats cho Events 2, 5, 6, 7
-- ============================================================

-- Lấy max zone id hiện tại để biết vị trí bắt đầu
-- (MySQL auto_increment lo việc này tự động)

-- ── EVENT 2: Bùi Công Nam — SVĐ Mỹ Đình (sân vận động, ~300 chỗ) ──
INSERT INTO zones (event_id, name, price, color_code, rows_count, seats_per_row, sort_order, created_at, updated_at) VALUES
(2, 'SVIP',    1500000, '#F59E0B', 2, 20, 0, NOW(), NOW()),
(2, 'VIP',     900000,  '#059669', 3, 25, 1, NOW(), NOW()),
(2, 'Hạng A',  600000,  '#3B82F6', 4, 25, 2, NOW(), NOW()),
(2, 'Hạng B',  350000,  '#8B5CF6', 3, 30, 3, NOW(), NOW());

-- ── EVENT 5: Quang Hà — Lâu Đài Đà Lạt (nhỏ, ~150 chỗ) ──
INSERT INTO zones (event_id, name, price, color_code, rows_count, seats_per_row, sort_order, created_at, updated_at) VALUES
(5, 'Premium', 900000,  '#F59E0B', 3, 15, 0, NOW(), NOW()),
(5, 'Standard',500000,  '#3B82F6', 5, 15, 1, NOW(), NOW()),
(5, 'Economy', 300000,  '#6B7280', 4, 15, 2, NOW(), NOW());

-- ── EVENT 6: Nhạc Nước — Van Phuc City Outdoor (~250 chỗ) ──
INSERT INTO zones (event_id, name, price, color_code, rows_count, seats_per_row, sort_order, created_at, updated_at) VALUES
(6, 'VIP Khán Đài',    800000,  '#F59E0B', 3, 20, 0, NOW(), NOW()),
(6, 'Thường Khán Đài', 400000,  '#3B82F6', 5, 20, 1, NOW(), NOW()),
(6, 'Khu Đứng',        200000,  '#6B7280', 2, 30, 2, NOW(), NOW());

-- ── EVENT 7: Summer Concert — GEM Center HCM (~280 chỗ) ──
INSERT INTO zones (event_id, name, price, color_code, rows_count, seats_per_row, sort_order, created_at, updated_at) VALUES
(7, 'VIP',     1200000, '#059669', 2, 20, 0, NOW(), NOW()),
(7, 'Stall',   750000,  '#F97316', 5, 24, 1, NOW(), NOW()),
(7, 'Balcony', 480000,  '#3B82F6', 4, 20, 2, NOW(), NOW());

-- ── Tạo seats cho tất cả zones mới (event 2,5,6,7) ──
-- Sử dụng stored procedure tạm để generate seats
DROP PROCEDURE IF EXISTS gen_seats;

DELIMITER //
CREATE PROCEDURE gen_seats()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE zid INT;
  DECLARE rcount INT;
  DECLARE scount INT;
  DECLARE r INT;
  DECLARE s INT;
  DECLARE rowLabel CHAR(1);
  
  DECLARE cur CURSOR FOR 
    SELECT id, rows_count, seats_per_row FROM zones 
    WHERE event_id IN (2, 5, 6, 7);
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO zid, rcount, scount;
    IF done THEN LEAVE read_loop; END IF;
    
    SET r = 0;
    WHILE r < rcount DO
      SET rowLabel = ELT(r + 1, 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P');
      SET s = 1;
      WHILE s <= scount DO
        INSERT INTO seats (zone_id, row_label, seat_number, status, created_at, updated_at)
        VALUES (zid, rowLabel, s, 'available', NOW(), NOW());
        SET s = s + 1;
      END WHILE;
      SET r = r + 1;
    END WHILE;
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;

CALL gen_seats();
DROP PROCEDURE IF EXISTS gen_seats;

-- Xác nhận kết quả
SELECT e.id, e.title,
       COUNT(DISTINCT z.id) as zone_count,
       COUNT(s.id) as seat_count
FROM events e
LEFT JOIN zones z ON z.event_id = e.id
LEFT JOIN seats s ON s.zone_id = z.id
WHERE e.id IN (2,5,6,7)
GROUP BY e.id, e.title;
