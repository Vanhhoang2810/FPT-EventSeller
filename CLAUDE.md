# TicketRush — Project Instructions

## Ngôn ngữ
- Code: tiếng Anh (biến, hàm, class, file, branch)
- Comment, commit message, error message, UI text: tiếng Việt
- Thuật ngữ kỹ thuật giữ nguyên tiếng Anh

## Tài liệu
- Docs nằm trong `docs/` (9 files) + `design.md` (root)
- Hub file: `docs/plan.md` — overview, phases, mapping tiêu chí
- Đề bài gốc: `CONTEXT.MD` — nguồn sự thật, không được sửa

## Quy tắc khi implement

### Docs-sync: Tự sửa docs khi phát hiện sai sót
Khi implement mà phát hiện docs (docs/*.md hoặc design.md) **sai, thiếu, hoặc conflict** với code thực tế:
1. **Sửa docs ngay** trong cùng commit — không để "sửa sau"
2. Ghi rõ trong commit message: `docs: cập nhật [file] — [lý do]`
3. Ưu tiên: code đúng > docs đúng. Nếu docs sai mà code đúng → sửa docs. Nếu code sai → sửa code.

Ví dụ:
- Implement API mà thấy endpoint path trong `docs/api.md` không hợp lý → sửa cả code lẫn docs
- Implement component thấy tên khác folder-structure.md → sửa docs cho khớp
- Thêm field mới vào DB schema → cập nhật `docs/database.md`

### Cross-check sau mỗi phase
Sau khi hoàn thành 1 phase (Phase 1, 2, 3, 4):
1. Chạy prompt cross-check (xem `docs/plan.md` hoặc README.md)
2. Fix mọi inconsistency phát hiện
3. Đánh dấu phase completed trong `docs/plan.md`

## Tech stack
- Frontend: React 19, Vite 6, TypeScript, TailwindCSS 4, shadcn/ui, Redux Toolkit, React Router 7
- Backend: Node.js 22, Express 5, TypeScript, Sequelize 6, MySQL 8, Redis 7, Socket.IO 4, BullMQ
- Chi tiết: `docs/tech-stack.md`

## Folder structure
- Frontend: feature-based (`src/features/[module]/`)
- Backend: module-based layered (`src/modules/[module]/controller+service+routes+validation+types`)
- Chi tiết: `docs/folder-structure.md`

## Database
- 15 bảng, Sequelize ORM, migrations + seeders
- Pessimistic locking (SELECT FOR UPDATE) cho seat booking
- Chi tiết: `docs/database.md`

## Testing
- Frontend: Vitest
- Backend: Jest + Supertest
- Test description tiếng Việt
- Mỗi bug fix → viết failing test trước

## Git
- Branch: `feat/`, `fix/`, `refactor/`, `docs/`
- Commit: Conventional Commits, subject tiếng Việt
- Không `git add .` — add từng file
