import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Share, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { useLibraryQr } from '@/hooks/use-libraries';
import { spacing, radius } from '@/constants/design';
import { showToast } from '@/lib/toast';

export default function QrCodeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: qrData, isLoading, refetch, isRefetching } = useLibraryQr();

  const handleShare = async () => {
    if (!qrData?.qrCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Save base64 to temp file to share
      const base64Code = qrData.qrCode.split('base64,')[1] || qrData.qrCode;
      const filename = `${FileSystem.cacheDirectory}library-qr.png`;
      await FileSystem.writeAsStringAsync(filename, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filename, {
          mimeType: 'image/png',
          dialogTitle: 'Library Seat Availability QR',
          UTI: 'public.png',
        });
      } else {
        await Share.share({
          url: filename,
          message: `Check seat availability at our library: ${qrData.url}`,
        });
      }
    } catch (error) {
      console.error('Sharing error:', error);
      showToast('Failed to share QR code', 'error');
    }
  };

  const handleRegenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ 
        title: 'Share QR Code', 
        headerShown: true, 
        headerTransparent: true, 
        headerTintColor: theme.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )
      }} />
      
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="qr-code" size={12} color={theme.primary} />
                <Text style={[styles.tagText, { color: theme.primary }]}>DIGITAL ACCESS</Text>
              </View>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Seat Availability QR Code</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Generate a unique QR code for your library. Students can scan this to check real-time seat availability without logging in.
            </Text>
          </View>

          {/* QR Display Area */}
          <View style={[styles.qrContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {isLoading ? (
              <View style={styles.placeholder}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.placeholderText, { color: theme.muted }]}>Generating QR...</Text>
              </View>
            ) : qrData ? (
              <View style={styles.qrWrapper}>
                <View style={[styles.qrBorder, { borderColor: theme.primary + '20' }]}>
                  <Image 
                    source={{ uri: qrData.qrCode }} 
                    style={styles.qrImage}
                    contentFit="contain"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(qrData.url)}
                  style={styles.previewBtn}
                >
                  <Text style={[styles.previewText, { color: theme.primary }]}>PREVIEW PAGE</Text>
                  <Ionicons name="open-outline" size={14} color={theme.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="alert-circle-outline" size={40} color={theme.muted} style={{ opacity: 0.3 }} />
                <Text style={[styles.placeholderText, { color: theme.muted }]}>Failed to load QR</Text>
              </View>
            )}
          </View>

          {/* Features List */}
          <View style={styles.features}>
            <FeatureItem 
              icon="checkmark-circle" 
              text="Public access for students (no login required)" 
              theme={theme} 
            />
            <FeatureItem 
              icon="checkmark-circle" 
              text="High-resolution for high-quality printing" 
              theme={theme} 
            />
            <FeatureItem 
              icon="checkmark-circle" 
              text="Real-time data synchronization every 30s" 
              theme={theme} 
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={handleRegenerate}
              disabled={isRefetching || isLoading}
              style={[styles.mainBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
            >
              {isRefetching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>REGENERATE QR</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleShare}
              disabled={!qrData}
              style={[styles.outlineBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <Ionicons name="share-outline" size={20} color={theme.text} />
              <Text style={[styles.outlineBtnText, { color: theme.text }]}>SHARE OR DOWNLOAD</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

function FeatureItem({ icon, text, theme }: { icon: keyof typeof Ionicons.glyphMap; text: string; theme: any }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={18} color={theme.success} />
      <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  backBtn: {
    padding: 8,
    marginLeft: spacing.md,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    opacity: 0.8,
  },
  qrContainer: {
    borderRadius: 32,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  qrWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  qrBorder: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  previewBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  placeholder: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  features: {
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  mainBtn: {
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  outlineBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 10,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
