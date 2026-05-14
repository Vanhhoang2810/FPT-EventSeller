import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsAdmin,
  selectAccessToken,
  clearCredentials,
} from '../store/authSlice';
import { useLogoutMutation } from '../services/authApi';
import { broadcastAuth } from '../../../app/SessionProvider';
import { ROUTES } from '../../../shared/constants/routes';
import { toast } from 'sonner';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const accessToken = useSelector(selectAccessToken);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Vẫn clear state dù server lỗi
    } finally {
      broadcastAuth('logout'); // notify các tab khác
      dispatch(clearCredentials());
      navigate(ROUTES.HOME);
      toast.success('Đã đăng xuất');
    }
  };

  return {
    user,
    isAuthenticated,
    isAdmin,
    accessToken,
    logout,
  };
}
