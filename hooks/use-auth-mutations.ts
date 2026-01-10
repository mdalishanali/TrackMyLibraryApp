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
  platform?: string;
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
      const { data } = await api.post('/auth/login', payload, { successToastMessage: 'Logged in' });
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
      const { data } = await api.post('/auth/signup', payload, { successToastMessage: 'Account created' });
      return data;
    },
    onSuccess: ({ user, token }) => {
      setAuth({ user, token });
    },
  });
};

export type ForgotPasswordPayload = {
  email: string;
};

export const useForgotPasswordMutation = () => {
  return useMutation<{ success: boolean; data: string }, AxiosError<ApiError>, ForgotPasswordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/forgot-password', payload, { successToastMessage: 'Reset link sent' });
      return data;
    },
  });
};
