import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectAccessToken } from '../../features/auth/store/authSlice';

let socketInstance: Socket | null = null;

/** Lấy socket singleton trực tiếp — dùng khi không cần reactive ref */
export function getSocketInstance(): Socket | null {
  return socketInstance;
}

export function useSocket() {
  const accessToken = useSelector(selectAccessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';

    // Đọc visitorId từ localStorage để socket có thể verify ownership khi join chat room
    const visitorId = localStorage.getItem('tr_visitor_id') ?? undefined;
    const authPayload = { token: accessToken, visitorId };

    if (!socketInstance) {
      socketInstance = io(socketUrl, {
        auth: authPayload,
        transports: ['websocket'],
        autoConnect: true,
      });
    } else {
      const prev = socketInstance.auth as Record<string, unknown>;
      if (prev.token !== accessToken || prev.visitorId !== visitorId) {
        socketInstance.auth = authPayload;
        socketInstance.disconnect().connect();
      }
    }

    socketRef.current = socketInstance;
  }, [accessToken]);

  return socketRef;
}
