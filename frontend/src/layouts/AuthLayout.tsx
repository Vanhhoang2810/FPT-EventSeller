import { Outlet } from 'react-router-dom';
import { Logo } from '../shared/components/Logo';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Noise texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMDAnIGhlaWdodD0nMzAwJz48ZmlsdGVyIGlkPSduJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC42NScgbnVtT2N0YXZlcz0nMycgc3RpdGNoVGlsZXM9J3N0aXRjaCcvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbHRlcj0ndXJsKCNuKScgb3BhY2l0eT0nMC4wMycvPjwvc3ZnPg==')] opacity-30" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo với icon */}
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Auth card — glass effect */}
        <main id="main-content" className="glass rounded-2xl p-8 shadow-2xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
