import { Linking } from 'react-native';
import { showToast } from '@/lib/toast';

/**
 * Opens WhatsApp with a pre-filled message.
 * @param phone The phone number with country code.
 * @param message The pre-formatted message text.
 */
export const openWhatsappWithMessage = async (phone: string, message: string) => {
  try {
    // Sanitize phone number: remove all non-numeric characters (like +, -, spaces)
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodedMessage}`);
    }
  } catch (error) {
    console.error('WhatsApp Error:', error);
    showToast('Could not open WhatsApp', 'error');
  }
};
