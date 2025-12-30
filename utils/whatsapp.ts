import { Linking } from 'react-native';
import { showToast } from '@/lib/toast';

/**
 * Opens WhatsApp with a pre-filled message.
 * @param phone The phone number with country code.
 * @param message The pre-formatted message text.
 */
export const openWhatsappWithMessage = async (phone: string, message: string) => {
  try {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(`https://wa.me/${phone}?text=${encodedMessage}`);
    }
  } catch (error) {
    showToast('Could not open WhatsApp', 'error');
  }
};
