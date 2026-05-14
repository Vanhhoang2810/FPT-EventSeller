import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, clearCredentials, setLoading } from '../features/auth/store/authSlice';

// BroadcastChannel để đồng bộ auth giữa các tab cùng origin
const AUTH_CHANNEL = 'tr_auth_sync';

// React 18 Strict Mode gọi useEffect 2 lần trong dev — flag module-level ngăn double-init
// (kết hợp SELECT FOR UPDATE trong refreshToken, request thứ 2 thấy token đã revoke → 401)
let sessionInitialized = false;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Lắng nghe auth events từ tab khác
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = async (event) => {
      const { type } = event.data ?? {};

      if (type === 'login') {
        // Tab khác đã login → refresh để lấy accessToken mới
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST', credentials: 'include',
          });
          if (res.ok) {
            const json = await res.json();
            const { accessToken, user } = json.data ?? {};
            if (accessToken && user) dispatch(setCredentials({ accessToken, user }));
          }
        } catch { /* silent */ }
      }

      if (type === 'logout') {
        dispatch(clearCredentials());
      }
    };

    return () => { channel.close(); };
  }, [dispatch]);

  // Khởi tạo session khi app load — guard chống React 18 Strict Mode double-invoke
  useEffect(() => {
    if (sessionInitialized) return;
    sessionInitialized = true;

    const init = async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST', credentials: 'include',
        });

        if (res.ok) {
          const json = await res.json();
          const { accessToken, user } = json.data ?? {};
          if (accessToken && user) {
            dispatch(setCredentials({ accessToken, user }));
            return;
          }
        }

        if (res.status === 401) {
          dispatch(clearCredentials());
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    };

    init();
  }, [dispatch]);

  return <>{children}</>;
}

// Helper — gọi từ LoginPage/LogoutHandler để notify tab khác
export function broadcastAuth(type: 'login' | 'logout') {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    ch.postMessage({ type });
    ch.close();
  } catch { /* silent */ }
}
