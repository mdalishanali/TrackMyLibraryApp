import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { spacing } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';
import { UserPayload, UserRole } from '@/hooks/use-users';
import { showToast } from '@/lib/toast';

const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Manager'];
const MIN_CONTACT_DIGITS = 10;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const EMPTY_FORM = {
  name: '',
  email: '',
  contactNumber: '',
  password: '',
  role: null as UserRole | null,
};

type Props = {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: UserPayload) => Promise<void>;
};

/** Mirrors the web AddUserDialog validation (zod addUserSchema). */
function validateForm(form: typeof EMPTY_FORM): string | null {
  if (!form.name.trim()) return 'Name is required';
  if (!EMAIL_PATTERN.test(form.email.trim())) return 'Enter a valid email address';
  if (!/^\d+$/.test(form.contactNumber) || form.contactNumber.length < MIN_CONTACT_DIGITS) {
    return `Contact number must be at least ${MIN_CONTACT_DIGITS} digits`;
  }
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!form.role) return 'Please select a role';
  return null;
}

export function AddUserModal({ visible, isSubmitting, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const [form, setForm] = useState(EMPTY_FORM);

  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      contactNumber: form.contactNumber,
      password: form.password,
      role: form.role as UserRole,
    });
    setForm(EMPTY_FORM);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New User</Text>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.muted }]}>NAME</Text>
              <TextInput
                style={inputStyle}
                placeholder="Full name"
                placeholderTextColor={theme.muted}
                value={form.name}
                onChangeText={(t) => setField('name', t)}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.muted }]}>EMAIL</Text>
              <TextInput
                style={inputStyle}
                placeholder="user@example.com"
                placeholderTextColor={theme.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(t) => setField('email', t)}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.muted }]}>CONTACT NUMBER</Text>
              <TextInput
                style={inputStyle}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.muted}
                keyboardType="number-pad"
                value={form.contactNumber}
                onChangeText={(t) => setField('contactNumber', t.replace(/\D/g, ''))}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.muted }]}>PASSWORD</Text>
              <TextInput
                style={inputStyle}
                placeholder="Minimum 6 characters"
                placeholderTextColor={theme.muted}
                secureTextEntry
                value={form.password}
                onChangeText={(t) => setField('password', t)}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.muted }]}>ROLE</Text>
              <View style={styles.roleRow}>
                {ASSIGNABLE_ROLES.map((role) => {
                  const isSelected = form.role === role;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setField('role', role)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.roleChipText, { color: isSelected ? '#fff' : theme.text }]}>
                        {role}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <AppButton onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
                Add User
              </AppButton>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '88%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    gap: spacing.lg,
    paddingBottom: 40,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleChip: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
