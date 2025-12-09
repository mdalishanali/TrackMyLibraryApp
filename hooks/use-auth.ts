import { useMemo } from 'react';

import { useAuthStore } from '@/store/auth';

export const useAuth = () => {
  const { user, token, hydrated, logout, setAuth } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    hydrated: state.hydrated,
    logout: state.logout,
    setAuth: state.setAuth,
  }));

  return useMemo(
    () => ({
      user,
      token,
      hydrated,
      isAuthenticated: Boolean(token),
      logout,
      setAuth,
    }),
    [user, token, hydrated, logout, setAuth]
  );
};
