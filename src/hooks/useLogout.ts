import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(
    (message = '로그아웃 되었습니다.') => {
      alert(message);
      logout();
      navigate('/');
    },
    [logout, navigate],
  );
}
