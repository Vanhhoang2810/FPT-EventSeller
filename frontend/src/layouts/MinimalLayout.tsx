import { Outlet } from 'react-router-dom';

// Layout tối giản — không có header/footer riêng
// Các page trong layout này tự quản lý header của mình (vd: CheckoutPage có header + countdown)
export function MinimalLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
