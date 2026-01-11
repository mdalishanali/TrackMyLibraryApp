import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { showToast } from '@/lib/toast';

export function useOTAUpdates(options: { autoCheck: boolean } = { autoCheck: true }) {
  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        showToast('Update available. Downloading...', 'info');
        await Updates.fetchUpdateAsync();
        
        Alert.alert(
          'Update Ready',
          'A new version of the app is ready. Restart now to apply changes?',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Restart', 
              onPress: async () => {
                await Updates.reloadAsync();
              }
            }
          ]
        );
      } else {
        // Only show "No update" if manually triggered (we can't easily detect manual vs auto here without more state, but for now this is fine - actually on auto check we don't want to spam "No update").
        // Let's rely on the caller to handle success feedback if needed, or just return status.
    }
    } catch (error) {
      // You can also add more granular error handling here
      console.log(`Error fetching update: ${error}`);
    }
  }

  useEffect(() => {
    // Check for updates on app start, but only in non-development modes
    if (options.autoCheck && !__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  async function checkManual() {
     try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
            await onFetchUpdateAsync();
        } else {
            Alert.alert('Up to Date', 'You are already using the latest version of the app.');
        }
     } catch (e) {
        Alert.alert('Error', 'Failed to check for updates.');
     }
  }

  return { checkForUpdate: onFetchUpdateAsync, checkManual };
}
