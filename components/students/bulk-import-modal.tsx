import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ActivityIndicator, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius } from '@/constants/design';
import { useImportStudents } from '@/hooks/use-students';
import { showToast } from '@/lib/toast';

interface BulkImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BulkImportModal({ visible, onClose }: BulkImportModalProps) {
  const theme = useTheme();
  const importMutation = useImportStudents();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success'>('idle');

  const handlePickFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result);
        setStatus('idle');
      }
    } catch (err) {
      showToast('Error picking file', 'error');
    }
  };

  const handleImport = async () => {
    if (!file || file.canceled) return;

    try {
      setStatus('uploading');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const pickedFile = file.assets[0];
      
      await importMutation.mutateAsync({
        fileUri: pickedFile.uri,
        fileName: pickedFile.name,
        fileType: pickedFile.mimeType || 'text/csv',
      });

      setStatus('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Students imported successfully', 'success');
      
      setTimeout(() => {
        onClose();
        reset();
      }, 1500);
    } catch (err) {
      setStatus('idle');
      showToast('Failed to import students', 'error');
    }
  };

  const downloadTemplate = async () => {
    const headers = "Floor,Seat No,Full Name,Phone Number,Joining Date,Fathers Name,Address,Gender,Monthly Fees,Shift\nMain Hall,1,Ashis Bagati,7655098220,05/12/2025,Deenabandhu Bagati,\"Berhampur,Ganjam\",Male,650,Regular AC\nFloor 2,25,Badal Kumar Sahu,9337320067,06/12/2025,Saura Sahu,\"Berhampur,Ganjam\",Male,650,Regular AC";
    
    if (Platform.OS === 'web') {
      const blob = new Blob([headers], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_import_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const fileUri = FileSystem.cacheDirectory + 'student_import_template.csv';
      await FileSystem.writeAsStringAsync(fileUri, headers);
      await Sharing.shareAsync(fileUri);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
  };

  const renderContent = () => {
    if (status === 'success') {
      return (
        <View style={styles.stateContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme.success} />
          </View>
          <Text style={[styles.stateTitle, { color: theme.text }]}>Success!</Text>
          <Text style={[styles.stateDesc, { color: theme.muted }]}>Students have been imported.</Text>
        </View>
      );
    }

    return (
      <View style={styles.form}>
        <Pressable
          onPress={handlePickFile}
          style={({ pressed }) => [
            styles.uploadBox,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            file && { borderColor: theme.primary, backgroundColor: theme.primary + '05' },
            pressed && { opacity: 0.8 }
          ]}
        >
          {file && !file.canceled ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text" size={32} color={theme.primary} />
              <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                {file.assets[0].name}
              </Text>
              <Text style={[styles.fileSize, { color: theme.muted }]}>
                {(file.assets[0].size! / 1024).toFixed(1)} KB
              </Text>
              <Pressable onPress={reset} style={styles.closeBtn}>
                <Ionicons name="close-circle" size={20} color={theme.danger} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <View style={[styles.uploadIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="cloud-upload" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: theme.text }]}>Select CSV File</Text>
              <Text style={[styles.uploadSubtitle, { color: theme.muted }]}>Tap to browse your documents</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.actions}>
          <AppButton
            fullWidth
            onPress={handleImport}
            loading={status === 'uploading' || status === 'processing'}
            disabled={!file}
          >
            Start Import
          </AppButton>
          
          <AppButton
            variant="outline"
            fullWidth
            onPress={downloadTemplate}
            style={styles.templateBtn}
          >
            <Ionicons name="download-outline" size={18} color={theme.text} />
            <Text style={[styles.templateBtnText, { color: theme.text }]}>Download Template</Text>
          </AppButton>
        </View>

        <View style={styles.help}>
          <Ionicons name="information-circle-outline" size={14} color={theme.muted} />
          <Text style={[styles.helpText, { color: theme.muted }]}>
            Upload a CSV with columns: Floor, Seat No, Full Name, Phone, Joining Date...
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.badge, { color: theme.primary, backgroundColor: theme.primary + '15' }]}>BULK OPERATIONS</Text>
              <Text style={[styles.title, { color: theme.text }]}>Import Students</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeHeader}>
              <Ionicons name="close" size={24} color={theme.muted} />
            </Pressable>
          </View>

          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeHeader: {
    padding: 4,
  },
  form: {
    gap: 20,
  },
  uploadBox: {
    height: 160,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  uploadSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  fileInfo: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
    paddingHorizontal: 20,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.6,
  },
  closeBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
  },
  actions: {
    gap: 12,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
  },
  templateBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  help: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  helpText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    flex: 1,
    opacity: 0.6,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  stateDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
});
