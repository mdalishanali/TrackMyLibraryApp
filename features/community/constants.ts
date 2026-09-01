import { Ionicons } from '@expo/vector-icons';

export const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/EwWTjFuXvP9CiLPVmhFMlu?mode=gi_t';

// Official WhatsApp brand colors — kept verbatim so the join surfaces are
// instantly recognizable as WhatsApp, not a generic green.
export const WHATSAPP_GREEN = '#25D366';
export const WHATSAPP_DARK_GREEN = '#128C7E';

type CommunityBenefit = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

// Support leads — the group's pitch is "we're here when you need help".
export const COMMUNITY_BENEFITS: CommunityBenefit[] = [
  {
    icon: 'help-buoy-outline',
    title: 'Direct Help',
    description: 'Get quick answers to your technical or billing issues.',
  },
  {
    icon: 'notifications-outline',
    title: 'New Updates',
    description: 'Be the first to know about new features and bug fixes.',
  },
  {
    icon: 'people-outline',
    title: 'Networking',
    description: 'Connect with other library owners across India.',
  },
];
