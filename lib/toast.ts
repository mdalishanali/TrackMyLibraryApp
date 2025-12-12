import { toast } from 'react-native-hot-toast';

type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  if (type === 'success') return toast.success(message);
  if (type === 'error') return toast.error(message);
  return toast(message);
}
