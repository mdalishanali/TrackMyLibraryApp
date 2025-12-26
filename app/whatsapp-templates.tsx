import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import { useWhatsappTemplates } from '@/hooks/use-whatsapp';
import { LinearGradient } from 'expo-linear-gradient';

export default function WhatsappTemplatesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: templates, isLoading } = useWhatsappTemplates();

  const handleEdit = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/whatsapp-template-edit',
      params: { type }
    });
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/whatsapp-template-edit',
      params: { type: 'new_' + Date.now() }
    });
  };

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ 
        title: 'Message Templates', 
        headerTransparent: true,
        headerLeft: () => (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
        )
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Manage Templates</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Customize the automated messages sent to your students.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.list}>
            {Array.isArray(templates) && templates.map((tpl: any, index: number) => (
              <Pressable
                key={tpl.type || index}
                onPress={() => handleEdit(tpl.type)}
                style={({ pressed }) => [
                  styles.templateCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: (tpl.isSystem ? theme.primary : theme.info) + '15' }]}>
                  <Ionicons 
                    name={tpl.isSystem ? "construct-outline" : "chatbubble-ellipses-outline"} 
                    size={22} 
                    color={tpl.isSystem ? theme.primary : theme.info} 
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{tpl.title}</Text>
                    {tpl.isSystem && (
                      <View style={[styles.systemBadge, { backgroundColor: theme.surfaceAlt }]}>
                        <Text style={[styles.systemBadgeText, { color: theme.muted }]}>SYSTEM</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardPreview, { color: theme.muted }]} numberOfLines={2}>
                    {tpl.body}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.muted + '50'} />
              </Pressable>
            ))}

            <AppButton
              variant="outline"
              onPress={handleCreate}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={20} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: '700', marginLeft: 4 }}>Add Custom Template</Text>
            </AppButton>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backBtn: {
    marginLeft: spacing.lg,
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  list: {
    gap: spacing.md,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  systemBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addBtn: {
    marginTop: spacing.md,
    height: 56,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
