import { Platform } from 'react-native';

const localAPIBaseUrl =
  Platform.select({
    ios: 'http://localhost:5000/api',
    android: 'http://10.0.2.2:5000/api',
    default: 'https://api.trackmylibrary.in/api',
  }) || 'https://api.trackmylibrary.in/api';

export const API_BASE_URL = __DEV__
  ? localAPIBaseUrl
  : (process.env.EXPO_PUBLIC_API_URL || 'https://api.trackmylibrary.in/api');

export const BRAND_FOOTER_TEXT = 'Made with ❤️ by TrackMyLibrary';
