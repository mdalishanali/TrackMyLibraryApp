import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/lib/api-client';
import { AuthUser } from '@/store/auth';
import { useAuth } from './use-auth';

type AuthResponse = {
  message?: string;
  token: string;
  user: AuthUser;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessAddress: string;
  contactNumber: string;
};

export type ApiError = {
  message?: string;
};

export const getErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message || axiosError.message || 'Something went wrong';
};

export const useLoginMutation = () => {
  const { setAuth } = useAuth();

  return useMutation<AuthResponse, AxiosError<ApiError>, LoginPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/login', payload);
      return data;
    },
    onSuccess: ({ user, token }) => {
      setAuth({ user, token });
    },
  });
};

export const useSignupMutation = () => {
  const { setAuth } = useAuth();

  return useMutation<AuthResponse, AxiosError<ApiError>, SignupPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/signup', payload);
      return data;
    },
    onSuccess: ({ user, token }) => {
      setAuth({ user, token });
    },
  });
};
