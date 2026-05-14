import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../store/authSlice';
import type { RootState } from '../../../app/store';
import { ROUTES } from '../../../shared/constants/routes';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const location = useLocation();

  // Chỉ hiện spinner khi đang init session VÀ chưa biết trạng thái
  // Nếu đã authenticated rồi thì render luôn — không flicker
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
