import { useTheme } from 'next-themes';
import { useCallback } from 'react';

/**
 * Bọc setTheme với hiệu ứng chuyển màu mượt mà.
 * Thêm class "theme-switching" vào <html> trước khi toggle,
 * xóa sau khi transition hoàn thành (300ms).
 */
export function useThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = useCallback(() => {
    const html = document.documentElement;
    html.classList.add('theme-switching');
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setTimeout(() => html.classList.remove('theme-switching'), 350);
  }, [theme, setTheme]);

  return { theme, toggle };
}
