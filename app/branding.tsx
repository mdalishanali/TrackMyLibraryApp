import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import { useUpdateProfile } from '@/hooks/use-profile';
import { api } from '@/lib/api-client';
import { showToast } from '@/lib/toast';

export default function BrandingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  
  const [logo, setLogo] = useState<string | null>(user?.company?.libraryLogo || null);
  const [isUploading, setIsUploading] = useState(false);

  const company = user?.company;

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
        
        const manipulated = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        uploadLogo(manipulated.uri);
      }
    } catch (error) {
      showToast('Failed to pick image', 'error');
    }
  };

  const uploadLogo = async (uri: string) => {
    setIsUploading(true);
    try {
      const fileName = `logo-${Date.now()}.jpg`;
      const fileType = 'image/jpeg';
      
      const { data: presignedData } = await api.get('/students/presigned-url', {
        params: { fileName, fileType }
      });

      const { uploadUrl, fileUrl } = presignedData;

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

      await updateProfile.mutateAsync({ libraryLogo: fileUrl });
      
      setLogo(fileUrl);
      showToast('Logo Updated Successfully', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToast('Failed to upload logo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetLogo = () => {
    Alert.alert(
      'Reset Logo',
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
              setLogo(null);
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
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.surfaceAlt },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Library Branding</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Build your institutional identity</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <View style={[styles.logoSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionLabel, { color: theme.muted }]}>CURRENT LOGO</Text>
              
              <View style={styles.logoPreviewContainer}>
                {logo && typeof logo === 'string' && !logo.startsWith('{') ? (
                  <View style={styles.logoWrapper}>
                    <Image 
                      source={{ uri: logo }} 
                      style={styles.logoImage}
                      contentFit="contain"
                    />
                    <Pressable 
                      style={styles.removeBadge}
                      onPress={handleResetLogo}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="business" size={48} color={theme.muted + '40'} />
                    <Text style={[styles.placeholderText, { color: theme.muted }]}>No Logo Uploaded</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handlePickImage}
                disabled={isUploading}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  { backgroundColor: theme.primary },
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                  isUploading && { opacity: 0.6 }
                ]}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.uploadBtnText}>
                      {logo ? 'Change Logo' : 'Upload Library Logo'}
                    </Text>
                  </>
                )}
              </Pressable>
              
              <Text style={[styles.helperText, { color: theme.muted }]}>
                Supports JPG & PNG. Best fit: Square (1:1 aspect ratio).
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <View style={[styles.infoCard, { backgroundColor: theme.surfaceAlt }]}>
              <View style={styles.infoIconBox}>
                <Ionicons name="information-circle" size={24} color={theme.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: theme.text }]}>Why add a logo?</Text>
                <Text style={[styles.infoDesc, { color: theme.muted }]}>
                  Adding your logo will automatically brand all your:
                </Text>
                <View style={styles.benefitList}>
                  <BenefitItem icon="receipt" text="Automated WhatsApp Invoices" />
                  <BenefitItem icon="print" text="PDF Receipt Reports" />
                  <BenefitItem icon="qr-code" text="Digital Access QR Code" />
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <View style={[styles.previewSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Text style={[styles.sectionLabel, { color: theme.muted }]}>INVOICE HEADER PREVIEW</Text>
               <View style={[styles.invoiceMockup, { backgroundColor: '#f9fafb' }]}>
                  <View style={styles.mockupHeader}>
                      {logo ? (
                        <Image source={{ uri: logo }} style={styles.mockupLogo} contentFit="contain" />
                      ) : (
                        <View style={styles.mockupLogoPlaceholder} />
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.mockupTitle}>{company?.businessName || 'TRACK MY LIBRARY'}</Text>
                        <Text style={styles.mockupSubtitle}>{company?.businessAddress || '123 Main Street'}</Text>
                      </View>
                  </View>
                  <View style={styles.mockupDivider} />
                  <View style={styles.mockupRow} />
                  <View style={[styles.mockupRow, { width: '60%' }]} />
               </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

function BenefitItem({ icon, text }: { icon: any; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon} size={16} color={theme.primary} />
      <Text style={[styles.benefitText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: spacing.xl,
  },
  logoSection: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  logoPreviewContainer: {
    marginBottom: 24,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    width: '100%',
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  benefitList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewSection: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  invoiceMockup: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockupLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  mockupLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  mockupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  mockupSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  mockupDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  mockupRow: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  }
});
