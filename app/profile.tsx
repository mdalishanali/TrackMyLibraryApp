import { useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';

import { api } from '@/lib/api-client';
import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { spacing, radius, typography } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateProfile } from '@/hooks/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { showToast } from '@/lib/toast';
import { useOTAUpdates } from '@/hooks/use-updates';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const router = useRouter();
  const { checkManual } = useOTAUpdates({ autoCheck: false });

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? '');
  const [businessName, setBusinessName] = useState(
    typeof user?.company === 'object' ? (user.company as any)?.businessName ?? '' : ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    typeof user?.company === 'object' ? (user.company as any)?.businessAddress ?? '' : ''
  );
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Manipulate image (resize to 512x512)
        const manipulated = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        uploadLogo(manipulated.uri);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      showToast('Failed to pick image', 'error');
    }
  };

  const uploadLogo = async (uri: string) => {
    setIsUploading(true);
    try {
      // 1. Get Presigned URL
      const fileName = `logo-${Date.now()}.jpg`;
      const fileType = 'image/jpeg';
      
      const { data: presignedData } = await api.get('/students/presigned-url', {
        params: { fileName, fileType }
      });

      const { uploadUrl, fileUrl } = presignedData;

      // 2. Upload to S3 using XHR (required for binary blobs on React Native)
      const blobResponse = await fetch(uri);
      const blob = await blobResponse.blob();
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', fileType);
        xhr.onload = () => {
          if (xhr.status === 200) resolve(true);
          else reject(new Error('S3 Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(blob);
      });

      // 3. Save to Profile
      await updateProfile.mutateAsync({ libraryLogo: fileUrl });
      showToast('Logo Updated', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Logo upload error:', error);
      showToast('Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const onSaveProfile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateProfile.mutateAsync({ name, email, contactNumber, businessName, businessAddress });
      showToast('Profile updated', 'success');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast((error as Error).message || 'Unable to update profile', 'error');
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert(
      'Remove Logo',
      'Are you sure you want to remove your library logo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              await updateProfile.mutateAsync({ libraryLogo: "" });
              showToast('Logo removed', 'success');
            } catch (error) {
              showToast('Failed to remove logo', 'error');
            } finally {
              setIsUploading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
              <View style={styles.headerTop}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  style={({ pressed }) => [
                    styles.backBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
                  ]}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Premium Hero Card */}
              <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <LinearGradient
                  colors={[theme.primary + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <Pressable 
                    onPress={handlePickImage}
                    disabled={isUploading}
                    style={({ pressed }) => [
                      styles.avatarBox, 
                      { backgroundColor: theme.primary + '20', borderColor: theme.border },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    {isUploading ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : (user?.company?.libraryLogo && typeof user.company.libraryLogo === 'string' && !user.company.libraryLogo.startsWith('{')) ? (
                      <Image
                        source={{ uri: user.company.libraryLogo }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.avatarText, { color: theme.primary }]}>
                          {(name || user?.name || 'A').slice(0, 1).toUpperCase()}
                        </Text>
                        <View style={styles.editBadge}>
                          <Ionicons name="camera" size={10} color="#fff" />
                        </View>
                      </View>
                    )}
                  </Pressable>
                  <View style={styles.heroMeta}>
                    <Text style={[styles.heroName, { color: theme.text }]} numberOfLines={1}>
                      {name || 'Add Name'}
                    </Text>
                    <Text style={[styles.heroEmail, { color: theme.muted }]} numberOfLines={1}>
                      {email || user?.email || 'No email provided'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: theme.surfaceAlt }]}>
                      <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
                      <Text style={[styles.badgeText, { color: theme.primary }]}>Account Owner</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            <View style={styles.form}>
              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Info</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.inputGroup}>
                <Field label="Full Name" value={name} onChangeText={setName} theme={theme} placeholder="Enter your name" icon="person-outline" />
                <Field
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  theme={theme}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@company.com"
                  icon="mail-outline"
                />
                <Field
                  label="Phone Number"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  theme={theme}
                  keyboardType="phone-pad"
                  placeholder="Contact number"
                  icon="call-outline"
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Business Details</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {user?.company?.libraryLogo && (
                        <Pressable 
                            onPress={handleRemoveLogo}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: theme.danger }}>Remove</Text>
                            <Ionicons name="trash-outline" size={14} color={theme.danger} />
                        </Pressable>
                      )}
                      <Pressable 
                          onPress={handlePickImage}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      >
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.primary }}>Change Logo</Text>
                          <Ionicons name="image-outline" size={14} color={theme.primary} />
                      </Pressable>
                    </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.inputGroup}>
                <Field
                  label="Library Name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  theme={theme}
                  placeholder="Library / Institution name"
                  icon="business-outline"
                />
                <Field
                  label="Full Address"
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  theme={theme}
                  placeholder="Street, City, State"
                  icon="location-outline"
                  multiline
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(600).duration(600)}
                style={{ marginTop: spacing.xl, marginBottom: 40 }}
              >
                <AppButton
                  onPress={onSaveProfile}
                  loading={updateProfile.isPending}
                  fullWidth
                >
                  Save Profile Changes
                </AppButton>
              </Animated.View>
            </View>

            <View style={styles.form}>
              <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                <AppButton
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    checkManual();
                  }}
                  variant="outline"
                >
                  Check for Updates
                </AppButton>
                <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: theme.muted }}>
                  Version 1.0.7
                </Text>
              </Animated.View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </SafeScreen>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  theme: ReturnType<typeof useTheme>;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
};

const Field = ({ label, value, onChangeText, theme, keyboardType = 'default', autoCapitalize, placeholder, icon, multiline }: FieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: 8, marginBottom: 4 }}>
      <Text style={[styles.label, { color: theme.muted }]}>{label.toUpperCase()}</Text>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.surface,
          borderColor: isFocused ? theme.primary : theme.border,
        }
      ]}>
        {icon && <Ionicons name={icon} size={20} color={isFocused ? theme.primary : theme.muted} style={{ marginLeft: 12 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder}
          placeholderTextColor={theme.muted + '80'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          style={[
            styles.input,
            { color: theme.text, height: multiline ? 80 : 50 }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroCard: {
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#374151',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  form: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  sectionHeader: {
    marginBottom: -8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  inputGroup: {
    gap: spacing.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
});
