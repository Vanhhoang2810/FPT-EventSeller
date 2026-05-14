# Database Schema

> **Ticket Rush Docs** | [Tổng quan](plan.md) | [Tech Stack](tech-stack.md) | [Folder Structure](folder-structure.md) | **Database** | [API](api.md) | [Technical](technical.md) | [Pages](pages.md) | [Security](security.md) | [Setup](setup.md) | [Design](../DESIGN.md)

---

## 3. Database Schema

### 3.1 ERD

```
User ──1:N──> Booking ──1:N──> Ticket
  │              │
  │              └──N:M──> Seat (qua BookingSeat)
  │                          │
  ├──1:N──> RefreshToken    │
  ├──1:N──> Notification   │
  │                        │
Event ──1:N──> Zone ──1:N──┘
  │
  └──N:1──> Venue

AuditLog ──N:1──> User (admin)
```

### 3.2 Chi tiết bảng

#### `users`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| password_hash | VARCHAR(255) | NULL | NULL nếu login bằng Google |
| full_name | VARCHAR(100) | NOT NULL | |
| phone | VARCHAR(20) | NULL | |
| date_of_birth | DATE | NULL | Thống kê độ tuổi |
| gender | ENUM('male','female','other') | NULL | Thống kê giới tính |
| avatar_url | VARCHAR(500) | NULL | |
| role | ENUM('customer','admin') | DEFAULT 'customer' | |
| is_active | BOOLEAN | DEFAULT true | Admin có thể ban |
| google_id | VARCHAR(100) | UNIQUE, NULL | Google OAuth ID |
| email_verified | BOOLEAN | DEFAULT false | Xác minh email |
| email_verify_token | VARCHAR(255) | NULL | Token verify (TTL 24h) |
| login_attempts | INT | DEFAULT 0 | Đếm login sai liên tiếp |
| locked_until | DATETIME | NULL | Khóa tài khoản tới thời điểm này |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

**Index:** `email` (UNIQUE), `google_id` (UNIQUE), `role`

#### `refresh_tokens`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → users.id, ON DELETE CASCADE | |
| token | VARCHAR(500) | UNIQUE, NOT NULL | Hashed refresh token |
| expires_at | DATETIME | NOT NULL | |
| revoked | BOOLEAN | DEFAULT false | Token đã bị thu hồi |
| device_info | VARCHAR(500) | NULL | User-Agent |
| ip_address | VARCHAR(45) | NULL | |
| created_at | DATETIME | | |

**Index:** `user_id`, `token` (UNIQUE), `expires_at`

#### `venues`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(200) | NOT NULL | |
| address | VARCHAR(500) | NOT NULL | |
| city | VARCHAR(100) | NULL | |
| capacity | INT | NOT NULL | |
| image_url | VARCHAR(500) | NULL | |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

#### `events`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| title | VARCHAR(200) | NOT NULL | |
| slug | VARCHAR(250) | UNIQUE | URL-friendly |
| description | TEXT | NULL | HTML/Markdown |
| short_description | VARCHAR(500) | NULL | Card mô tả ngắn |
| banner_url | VARCHAR(500) | NULL | |
| thumbnail_url | VARCHAR(500) | NULL | |
| category | ENUM('music','sports','theater','comedy','festival','conference','other') | NOT NULL | |
| venue_id | INT | FK → venues.id | |
| start_time | DATETIME | NOT NULL | |
| end_time | DATETIME | NOT NULL | |
| sale_start_time | DATETIME | NOT NULL | |
| sale_end_time | DATETIME | NULL | |
| status | ENUM('draft','published','on_sale','sold_out','completed','cancelled') | DEFAULT 'draft' | |
| max_tickets_per_user | INT | DEFAULT 5 | |
| queue_enabled | BOOLEAN | DEFAULT false | |
| queue_batch_size | INT | DEFAULT 50 | |
| created_by | INT | FK → users.id | |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

**Index:** `slug` (UNIQUE), `status`, `category`, `sale_start_time`, `venue_id`, FULLTEXT(`title`, `description`)

#### `zones`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| event_id | INT | FK → events.id, ON DELETE CASCADE | |
| name | VARCHAR(50) | NOT NULL | VIP, Regular... |
| price | DECIMAL(12,0) | NOT NULL | VND |
| color_code | VARCHAR(7) | NOT NULL | Hex (#FF5733) |
| rows_count | INT | NOT NULL | |
| seats_per_row | INT | NOT NULL | |
| sort_order | INT | DEFAULT 0 | |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

**Index:** `event_id`, UNIQUE(`event_id`, `name`)

#### `seats`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| zone_id | INT | FK → zones.id, ON DELETE CASCADE | |
| row_label | VARCHAR(5) | NOT NULL | A, B, C... |
| seat_number | INT | NOT NULL | |
| status | ENUM('available','locked','sold','disabled') | DEFAULT 'available' | |
| locked_at | DATETIME | NULL | |
| locked_by | INT | FK → users.id, NULL | |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

**Index:** `zone_id`, `status`, UNIQUE(`zone_id`, `row_label`, `seat_number`), `locked_at`

> Dùng **pessimistic locking** (SELECT FOR UPDATE) thay vì optimistic (version column) — giải thích ở Section 5.1.

#### `bookings`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → users.id | |
| event_id | INT | FK → events.id | |
| status | ENUM('pending','confirmed','cancelled','expired') | DEFAULT 'pending' | |
| total_amount | DECIMAL(12,0) | NOT NULL | VND |
| seat_count | INT | NOT NULL | |
| expires_at | DATETIME | NOT NULL | created_at + 10 phút |
| promo_code_id | INT | FK → promo_codes.id, NULL | Mã giảm giá đã áp dụng |
| discount_amount | DECIMAL(12,0) | DEFAULT 0 | Số tiền được giảm |
| confirmed_at | DATETIME | NULL | |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

**Index:** `user_id`, `event_id`, `status`, `expires_at`

#### `booking_seats`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| booking_id | INT | FK → bookings.id, ON DELETE CASCADE | |
| seat_id | INT | FK → seats.id | |
| price | DECIMAL(12,0) | NOT NULL | Giá tại thời điểm đặt |

**Index:** UNIQUE(`booking_id`, `seat_id`), `seat_id`

#### `tickets`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| booking_id | INT | FK → bookings.id | |
| seat_id | INT | FK → seats.id | |
| user_id | INT | FK → users.id | |
| event_id | INT | FK → events.id | |
| qr_code | VARCHAR(500) | UNIQUE, NOT NULL | Signed JWT token |
| status | ENUM('active','used','cancelled') | DEFAULT 'active' | |
| used_at | DATETIME | NULL | |
| created_at | DATETIME | | |

**Index:** `qr_code` (UNIQUE), `user_id`, `event_id`

#### `payments`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| booking_id | INT | FK → bookings.id | |
| amount | DECIMAL(12,0) | NOT NULL | |
| method | ENUM('simulated','vnpay','momo') | DEFAULT 'simulated' | |
| status | ENUM('pending','completed','failed','refunded') | DEFAULT 'pending' | |
| transaction_id | VARCHAR(100) | NULL | Mã giao dịch VNPay/MoMo |
| paid_at | DATETIME | NULL | |
| created_at | DATETIME | | |

**Index:** `booking_id`, `status`, `transaction_id`

#### `notifications`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → users.id, ON DELETE CASCADE | |
| type | ENUM('booking_confirmed','booking_expired','event_reminder','event_cancelled','queue_granted','system') | NOT NULL | |
| title | VARCHAR(200) | NOT NULL | Tiêu đề thông báo |
| message | TEXT | NOT NULL | Nội dung |
| link | VARCHAR(500) | NULL | Deep link (vd: /my-tickets/123) |
| is_read | BOOLEAN | DEFAULT false | |
| created_at | DATETIME | | |

**Index:** `user_id`, `is_read`, `created_at`

#### `audit_logs`
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| admin_id | INT | FK → users.id | |
| action | VARCHAR(100) | NOT NULL | create_event, ban_user, refund... |
| entity_type | VARCHAR(50) | NOT NULL | event, user, booking... |
| entity_id | INT | NULL | |
| details | JSON | NULL | |
| ip_address | VARCHAR(45) | NULL | |
| created_at | DATETIME | | |

**Index:** `admin_id`, `entity_type`, `created_at`

#### `favorites` (yêu thích sự kiện)
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → users.id, ON DELETE CASCADE | |
| event_id | INT | FK → events.id, ON DELETE CASCADE | |
| created_at | DATETIME | | |

**Index:** UNIQUE(`user_id`, `event_id`), `event_id`

#### `promo_codes` (mã giảm giá)
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Mã (VD: SUMMER2026) |
| discount_type | ENUM('percentage','fixed') | NOT NULL | Loại giảm |
| discount_value | DECIMAL(12,0) | NOT NULL | Giá trị (% hoặc VND) |
| max_discount | DECIMAL(12,0) | NULL | Giảm tối đa (cho %) |
| event_id | INT | FK → events.id, NULL | NULL = áp dụng tất cả |
| usage_limit | INT | NULL | Tổng lượt dùng tối đa |
| usage_count | INT | DEFAULT 0 | Đã dùng |
| per_user_limit | INT | DEFAULT 1 | Giới hạn/người |
| min_amount | DECIMAL(12,0) | DEFAULT 0 | Đơn tối thiểu |
| starts_at | DATETIME | NOT NULL | |
| expires_at | DATETIME | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | INT | FK → users.id | |
| created_at | DATETIME | | |
| updated_at | DATETIME | | |

**Index:** `code` (UNIQUE), `event_id`, `is_active`, `expires_at`

#### `promo_usage` (lịch sử dùng mã)
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | |
| promo_id | INT | FK → promo_codes.id | |
| user_id | INT | FK → users.id | |
| booking_id | INT | FK → bookings.id | |
| discount_amount | DECIMAL(12,0) | NOT NULL | Số tiền đã giảm |
| created_at | DATETIME | | |

**Index:** UNIQUE(`promo_id`, `user_id`, `booking_id`)
