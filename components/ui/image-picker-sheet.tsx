import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography, themeFor } from '@/constants/design';

const { height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: 'gallery' | 'camera') => void;
  theme: ReturnType<typeof themeFor>;
};

export const ImagePickerSheet = ({ visible, onClose, onSelect, theme }: Props) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View style={[styles.backdropFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          
          <Text style={[styles.title, { color: theme.text }]}>Student Photo</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Choose a source for the profile picture</Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.surfaceAlt }]}
              onPress={() => {
                onClose();
                onSelect('camera');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="camera" size={24} color={theme.text} />
              </View>
              <Text style={[styles.optionText, { color: theme.text }]}>Take Photo</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.surfaceAlt }]}
              onPress={() => {
                onClose();
                onSelect('gallery');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="images" size={24} color={theme.text} />
              </View>
              <Text style={[styles.optionText, { color: theme.text }]}>Choose from Gallery</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 20,
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.size.md,
    fontWeight: '700',
  },
});
