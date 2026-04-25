import { Platform } from 'react-native';

const localAPIBaseUrl = "http://localhost:4000/api"

export const API_BASE_URL = __DEV__
  ? localAPIBaseUrl
  : (process.env.EXPO_PUBLIC_API_URL || 'https://library-server-623984863088.asia-south1.run.app/api');

export const BRAND_FOOTER_TEXT = 'Made with ❤️ by TrackMyLibrary';

export const STORE_URLS = {
  ios: 'https://apps.apple.com/in/app/library-manager-trackmylibrary/id6756526567',
  android: 'https://play.google.com/store/apps/details?id=com.librarymanager.trackmylibrary',
};
