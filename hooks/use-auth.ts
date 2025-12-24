import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth';

export const useAuth = () => {
  const { user, token, hydrated, logout, setAuth, updateUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      hydrated: state.hydrated,
      logout: state.logout,
      setAuth: state.setAuth,
      updateUser: state.updateUser,
    }))
  );

  return {
    user,
    token,
    hydrated,
    isAuthenticated: Boolean(token),
    logout,
    setAuth,
    updateUser,
  };
};
