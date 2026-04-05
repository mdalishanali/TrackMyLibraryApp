import { useRef, useState } from 'react';
import { View, Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import { showToast } from '@/lib/toast';

interface ShareImageOptions {
  fileName?: string;
  format?: 'png' | 'jpg';
  quality?: number;
  dialogTitle?: string;
  fallbackMessage?: string;
}

export const useShareImage = () => {
  const viewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareViewAsImage = async (options: ShareImageOptions = {}) => {
    const {
      fileName = 'shared-image',
      format = 'png',
      quality = 1,
      dialogTitle = 'Share Image',
      fallbackMessage = 'Sharing this official document.',
    } = options;

    if (!viewRef.current) {
      showToast('View not ready for capture', 'error');
      return;
    }

    try {
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Capture the view as an image
      const uri = await captureRef(viewRef, {
        format,
        quality,
        result: 'tmpfile',
      });

      // Check if native sharing is available (mostly for mobile)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: `image/${format}`,
          dialogTitle,
          UTI: format === 'png' ? 'public.png' : 'public.jpeg',
        });
      } else {
        // Fallback to text sharing if image sharing is not supported (e.g., some web/simulators)
        await Share.share({
          message: fallbackMessage,
          title: dialogTitle,
        });
      }
    } catch (error) {
      console.error('[useShareImage] Error:', error);
      showToast('Failed to generate sharing image', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return {
    viewRef,
    isSharing,
    shareViewAsImage,
  };
};
