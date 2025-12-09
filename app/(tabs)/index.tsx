import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <View style={styles.row}>
          <ThemedText type="title">Welcome{user?.name ? `, ${user.name}` : '!'}</ThemedText>
          <HelloWave />
        </View>
        <ThemedText>
          You are signed in with {user?.email || 'your account'}. Manage seats, students, and billing from the tabs
          below.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Session</ThemedText>
        <ThemedText>
          Token stored securely with MMKV & Zustand. Tap below to clear your session and return to the auth flow.
        </ThemedText>
        <Pressable style={styles.logoutButton} onPress={logout} accessibilityRole="button">
          <ThemedText type="defaultSemiBold" style={styles.logoutText}>
            Sign out
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    gap: 12,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: '#fff',
  },
});
