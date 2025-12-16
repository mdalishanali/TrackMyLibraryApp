import axios from 'axios';

import { API_BASE_URL } from '@/constants/config';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth';
import { showToast } from '@/lib/toast';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * Skip the automatic success toast for POST requests.
     */
    skipSuccessToast?: boolean;
    /**
     * Custom success message for POST requests.
     */
    successToastMessage?: string;
  }
}

console.log({ API_BASE_URL });

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    const shouldToastSuccess = method === 'post' && !response.config.skipSuccessToast;

    if (shouldToastSuccess) {
      const message = response.config.successToastMessage ?? response.data?.message ?? 'Success';
      showToast(message, 'success');
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      queryClient.clear();
    }
    return Promise.reject(error);
  }
);
