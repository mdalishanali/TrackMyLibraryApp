import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  const toastType = type === 'info' ? 'info' : type;
  Toast.show({
    type: toastType,
    text1: message
  });
}
