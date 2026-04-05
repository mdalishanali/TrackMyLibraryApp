import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components/layout/safe-screen';
import { useTheme } from '@/hooks/use-theme';
import { useStudentQuery } from '@/hooks/use-students';
import { useAuth } from '@/hooks/use-auth';
import { useShareImage } from '@/hooks/use-share-image'; // New hook!
import { DigitalIdCard } from '@/components/students/DigitalIdCard';
import { spacing, radius } from '@/constants/design';
import { FullScreenLoader } from '@/components/ui/fullscreen-loader';
import { AppButton } from '@/components/ui/app-button';

export default function StudentIdScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Decoupled hooks for Data & Image Sharing
  const { data: student, isLoading } = useStudentQuery(id as string);
  const { viewRef, isSharing, shareViewAsImage } = useShareImage();

  if (isLoading || !student) {
    return <FullScreenLoader message="Generating Student ID..." />;
  }

  const handleShareCard = () => {
    shareViewAsImage({
      fileName: `student-id-${student.name}`,
      dialogTitle: `Student ID Card - ${student.name}`,
      fallbackMessage: `Official ID for ${student.name} at ${user?.company?.businessName}. Member ID: #${student.id || student._id}`,
    });
  };

  const companyData = {
    businessName: user?.company?.businessName || 'Track My Library',
    libraryLogo: user?.company?.libraryLogo,
    businessAddress: user?.company?.businessAddress,
    contactNumber: user?.contactNumber,
  };

  const studentData = {
      name: student.name,
      fatherName: (student as any).fatherName,
      seatNumber: (student as any).seatNumber,
      id: student.id || (student as any)._id,
      joiningDate: student.joiningDate,
      profilePicture: student.profilePicture,
      lastPayment: student.lastPayment ? { endDate: (student.lastPayment as any).endDate } : undefined
  };

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Digital ID Card',
        headerTransparent: true,
        headerTintColor: theme.text,
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoSection}>
           <View style={[styles.verifiedBadge, { backgroundColor: theme.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={14} color={theme.success} />
              <Text style={[styles.verifiedText, { color: theme.success }]}>VERIFIED MEMBER</Text>
           </View>
           <Text style={[styles.mainTitle, { color: theme.text }]}>Official ID Card</Text>
           <Text style={[styles.subtitle, { color: theme.muted }]}>
             This digital identity is verified by {user?.company?.businessName || 'the library'}.
           </Text>
        </View>

        {/* The component to capture, wrapped with the ref from hook */}
        <View collapsable={false} ref={viewRef} style={{ backgroundColor: theme.background }}>
            <DigitalIdCard 
                student={studentData} 
                company={companyData as any} 
                theme={theme} 
            />
        </View>

        <View style={styles.actionSection}>
          <AppButton 
            onPress={handleShareCard}
            icon="share-outline"
            fullWidth
            loading={isSharing}
          >
            Share ID Card as Image
          </AppButton>
          
          <View style={styles.tipBox}>
            <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
            <Text style={[styles.tipText, { color: theme.muted }]}>
              The ID card will be shared as a high-quality PNG image for the student to save.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  infoSection: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
    maxWidth: '85%',
  },
  actionSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
