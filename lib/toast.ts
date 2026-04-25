import React from 'react';
import Toast, { ToastConfig } from 'react-native-toast-message';

import { AppToast } from '@/components/ui/app-toast';

export type ToastType = 'success' | 'error' | 'info';

export const toastConfig: ToastConfig = {
  success: props => React.createElement(AppToast, { ...props, variant: 'success' }),
  error: props => React.createElement(AppToast, { ...props, variant: 'error' }),
  info: props => React.createElement(AppToast, { ...props, variant: 'info' }),
};

export function showToast(message: string, type: ToastType = 'info', description?: string) {
  Toast.show({
    type,
    text1: message,
    text2: description,
    position: 'top',
    topOffset: 65,
    visibilityTime: 4000,
  });
}
