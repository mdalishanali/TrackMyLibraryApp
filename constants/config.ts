import { Platform } from 'react-native';

const localAPIBaseUrl = "https://ea13c7dcea2a.ngrok-free.app/api"

export const API_BASE_URL = __DEV__
  ? localAPIBaseUrl
  : (process.env.EXPO_PUBLIC_API_URL || 'https://library-server-623984863088.asia-south1.run.app/api');

export const BRAND_FOOTER_TEXT = 'Made with ❤️ by TrackMyLibrary';
