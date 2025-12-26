import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/design';

type Props = {
  visible: boolean;
  templates: any[];
  onSelect: (template: any) => void;
  onClose: () => void;
  theme: any;
};

export function TemplateSelectorModal({
  visible,
  templates,
  onSelect,
  onClose,
  theme,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Choose Template</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.muted} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {templates.map((tpl, index) => (
              <Pressable
                key={tpl.type || index}
                onPress={() => onSelect(tpl)}
                style={({ pressed }) => [
                  styles.item,
                  { borderBottomColor: theme.border + '50' },
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
                <Ionicons name="chevron-forward" size={18} color={theme.muted + '50'} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxHeight: '70%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemPreview: {
    fontSize: 12,
    marginTop: 2,
  },
});
