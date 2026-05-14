// Google OAuth xử lý trực tiếp qua google-auth-library trong auth.service.ts
// Không dùng passport strategy để tránh phức tạp không cần thiết
export function setupPassport(): void {
  // no-op — passport không cần thiết với flow hiện tại
}
