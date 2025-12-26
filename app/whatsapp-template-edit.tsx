import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppBadge } from '@/components/ui/app-badge';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/constants/design';
import { useWhatsappTemplates, useUpdateTemplates } from '@/hooks/use-whatsapp';
import { showToast } from '@/lib/toast';

export default function WhatsappTemplateEditScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { data: templates, isLoading } = useWhatsappTemplates();
  const updateTemplatesMutation = useUpdateTemplates();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [templateType, setTemplateType] = useState(type);
  const [isSystem, setIsSystem] = useState(false);

  useEffect(() => {
    if (Array.isArray(templates) && type) {
      const existing = templates.find((t: any) => t.type === type);
      if (existing) {
        setTitle(existing.title);
        setBody(existing.body);
        setIsSystem(existing.isSystem || false);
        setTemplateType(existing.type);
      } else if (type.startsWith('new_')) {
        setTitle('');
        setBody('');
        setIsSystem(false);
        setTemplateType(type);
      }
    }
  }, [templates, type]);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      showToast('Title and Body are required', 'error');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      let newTemplates = [...(templates || [])];
      const index = newTemplates.findIndex((t: any) => t.type === templateType);
      
      const sessionTemplate = {
        type: templateType,
        title,
        body,
        isSystem
      };

      if (index > -1) {
        newTemplates[index] = sessionTemplate;
      } else {
        newTemplates.push(sessionTemplate);
      }

      await updateTemplatesMutation.mutateAsync(newTemplates);
      showToast('Template saved', 'success');
      router.back();
    } catch (error) {
      showToast('Failed to save template', 'error');
    }
  };

  const handleDelete = async () => {
    if (isSystem) {
      showToast('System templates cannot be deleted', 'error');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const newTemplates = templates.filter((t: any) => t.type !== templateType);
      await updateTemplatesMutation.mutateAsync(newTemplates);
      showToast('Template removed', 'success');
      router.back();
    } catch (error) {
      showToast('Failed to delete template', 'error');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <Stack.Screen options={{ 
        title: 'Edit Template',
        headerTransparent: true,
        headerLeft: () => (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
        )
      }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {type?.startsWith('new_') ? 'New Template' : 'Update Message'}
            </Text>
            {isSystem && (
              <AppBadge tone="info" style={{ marginTop: 8 }}>System Managed Template</AppBadge>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>TEMPLATE NAME</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Early Bird Offer"
                placeholderTextColor={theme.muted + '80'}
                editable={!isSystem}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.muted }]}>MESSAGE BODY</Text>
                <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                  <Text style={[styles.helpText, { color: theme.primary }]}>View Tags</Text>
                </Pressable>
              </View>
              <TextInput
                style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                value={body}
                onChangeText={setBody}
                multiline
                placeholder="Write your message here..."
                placeholderTextColor={theme.muted + '80'}
                textAlignVertical="top"
              />
              <Text style={[styles.hint, { color: theme.muted }]}>
                Available Tags: {'{student_name}'}, {'{business_name}'}, {'{joining_date}'}, {'{amount}'}, {'{end_date}'}
              </Text>
            </View>

            <View style={{ marginTop: 20, gap: spacing.md }}>
              <AppButton
                onPress={handleSave}
                loading={updateTemplatesMutation.isPending}
                fullWidth
              >
                Save Template
              </AppButton>

              {!isSystem && !type?.startsWith('new_') && (
                <AppButton
                  variant="outline"
                  tone="danger"
                  onPress={handleDelete}
                  fullWidth
                >
                  Delete Template
                </AppButton>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 80,
  },
  backBtn: {
    marginLeft: spacing.lg,
    padding: 4,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  form: {
    gap: spacing.xl,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.6,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 200,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
