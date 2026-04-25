import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing } from '@/constants/design';

type Props = {
  visible: boolean;
  templates: any[];
  onSelect: (template: any, method: 'api' | 'handset') => void;
  onClose: () => void;
  theme: any;
  hasCredits?: boolean;
};

export function TemplateSelectorModal({
  visible,
  templates,
  onSelect,
  onClose,
  theme,
  hasCredits = true,
}: Props) {
  const [method, setMethod] = useState<'api' | 'handset'>('handset');

  const handleMethodChange = (newMethod: 'api' | 'handset') => {
    if (newMethod === 'api' && !hasCredits) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethod(newMethod);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable 
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Choose Template</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>Select a message to send to student</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.muted} />
            </Pressable>
          </View>

          {/* Mode Selector */}
          <View style={[styles.selectorContainer, { backgroundColor: theme.surfaceAlt }]}>
            <Pressable
              onPress={() => handleMethodChange('handset')}
              style={[
                styles.methodBtn,
                method === 'handset' && { backgroundColor: theme.primary }
              ]}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={method === 'handset' ? '#fff' : theme.muted} />
              <Text style={[styles.methodText, { color: method === 'handset' ? '#fff' : theme.muted }]}>Handset</Text>
            </Pressable>

            <View style={{ width: 1, height: '60%', backgroundColor: theme.border + '30' }} />

            <Pressable
              onPress={() => handleMethodChange('api')}
              style={[
                styles.methodBtn,
                method === 'api' && { backgroundColor: theme.primary },
                !hasCredits && { opacity: 0.5 }
              ]}
            >
              <Ionicons 
                name={hasCredits ? "flash-outline" : "lock-closed-outline"} 
                size={16} 
                color={method === 'api' ? '#fff' : theme.muted} 
              />
              <Text style={[styles.methodText, { color: method === 'api' ? '#fff' : theme.muted }]}>
                Direct API {!hasCredits && ' (Credits)'}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {templates.map((tpl, index) => (
              <Pressable
                key={tpl.type || index}
                onPress={() => onSelect(tpl, method)}
                style={({ pressed }) => [
                  styles.item,
                  { borderBottomColor: theme.border + '15' },
                  pressed && { backgroundColor: theme.surfaceAlt }
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: (tpl.isSystem ? theme.primary : theme.info) + '15' }]}>
                  <Ionicons 
                    name={tpl.isSystem ? "construct-outline" : "chatbubble-ellipses-outline"} 
                    size={20} 
                    color={tpl.isSystem ? theme.primary : theme.info} 
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{tpl.title}</Text>
                  <Text style={[styles.itemPreview, { color: theme.muted }]} numberOfLines={1}>
                    {tpl.body}
                  </Text>
                </View>
                <Ionicons name="send" size={18} color={method === 'api' ? theme.primary : '#25D366'} />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorContainer: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 12,
    gap: 8,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemPreview: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
});
