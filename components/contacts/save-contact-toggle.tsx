import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { radius, spacing } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';

/**
 * save-contact-toggle.tsx
 *
 * Opt-in row for saving a new student to the phone's contacts. Placed next to the
 * submit action rather than among the name/phone fields, so the owner sees it at the
 * moment of committing and it does not scroll away mid-form.
 */

interface SaveContactToggleProps {
    isEnabled: boolean;
    onToggle: () => void;
    /** When false, the copy warns that a permission prompt will follow. */
    isPermissionGranted: boolean;
}

const CHECKBOX_SIZE = 24;

export function SaveContactToggle({
    isEnabled,
    onToggle,
    isPermissionGranted,
}: SaveContactToggleProps) {
    const theme = useTheme();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
    };

    const hint = !isEnabled
        ? 'Their name will show on incoming calls'
        : isPermissionGranted
            ? 'Saved with seat, shift and fees'
            : 'Your phone will ask for contacts access';

    return (
        <Pressable
            onPress={handlePress}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isEnabled }}
            accessibilityLabel="Also save this student to my phone contacts"
            style={({ pressed }) => [
                styles.row,
                {
                    backgroundColor: isEnabled ? theme.primary + '10' : theme.surfaceAlt,
                    borderColor: isEnabled ? theme.primary + '35' : theme.border,
                    opacity: pressed ? 0.75 : 1,
                },
            ]}
        >
            <View
                style={[
                    styles.checkbox,
                    {
                        backgroundColor: isEnabled ? theme.primary : 'transparent',
                        borderColor: isEnabled ? theme.primary : theme.border,
                    },
                ]}
            >
                {isEnabled && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>

            <View style={styles.copy}>
                <Text style={[styles.label, { color: theme.text }]}>Save to phone contacts</Text>
                <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text>
            </View>

            <Ionicons
                name="person-add"
                size={18}
                color={isEnabled ? theme.primary : theme.muted}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    checkbox: {
        width: CHECKBOX_SIZE,
        height: CHECKBOX_SIZE,
        borderRadius: 7,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copy: { flex: 1, gap: 2 },
    label: { fontSize: 14, fontWeight: '700' },
    hint: { fontSize: 11, lineHeight: 15 },
});
