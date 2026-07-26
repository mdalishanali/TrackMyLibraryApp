import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { radius, spacing } from '@/constants/design';
import { useContactStudentsQuery, useRosterMatch, useSaveContacts } from '@/hooks/use-save-contacts';
import { useTheme } from '@/hooks/use-theme';
import { BulkSaveResult, RosterMatch } from '@/utils/saveContacts';

/**
 * save-contacts-modal.tsx
 *
 * Bulk "save all students to contacts" flow: explains the benefit, shows live
 * progress, then reports the tally. Progress matters because a few hundred native
 * phonebook writes take visible seconds — without it the screen looks frozen.
 *
 * Students are fetched here rather than by the parent screen so opening Settings
 * does not pull the full roster on every visit.
 */

interface SaveContactsModalProps {
    visible: boolean;
    onClose: () => void;
}

const BENEFITS = [
    'See student names on incoming calls',
    'Find students instantly in WhatsApp',
    'Seat, shift and fees saved in contact notes',
];

/** Names listed individually in the failure summary before collapsing to a count. */
const MAX_FAILED_NAMES_SHOWN = 3;

/**
 * "200 students" alone implies 200 new entries. When the phonebook has been read,
 * split the number so the owner knows what actually changes.
 */
const buildSubtitle = (total: number, match: RosterMatch | null): string => {
    const plural = total === 1 ? '' : 's';

    if (!match || match.alreadySaved === 0) {
        return `${total} student${plural} will be added to your phone`;
    }

    if (match.newContacts === 0) {
        return `All ${total} already saved — their details will be refreshed`;
    }

    return `${match.newContacts} new · ${match.alreadySaved} already saved (will be updated)`;
};

export function SaveContactsModal({ visible, onClose }: SaveContactsModalProps) {
    const theme = useTheme();
    const { isSaving, progress, saveMany } = useSaveContacts();
    const { data: students = [], isLoading } = useContactStudentsQuery(visible);
    const match = useRosterMatch(students, visible);
    const [result, setResult] = useState<BulkSaveResult | null>(null);

    const handleSave = async () => {
        const outcome = await saveMany(students);
        if (outcome) setResult(outcome);
    };

    const handleClose = () => {
        setResult(null);
        onClose();
    };

    const percent = progress && progress.total > 0
        ? Math.round((progress.done / progress.total) * 100)
        : 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="people" size={26} color={theme.primary} />
                        </View>
                        {!isSaving && (
                            <Pressable onPress={handleClose} hitSlop={12}>
                                <Ionicons name="close" size={24} color={theme.muted} />
                            </Pressable>
                        )}
                    </View>

                    {result ? (
                        <ResultView result={result} onDone={handleClose} />
                    ) : (
                        <>
                            <Text style={[styles.title, { color: theme.text }]}>Save Students to Contacts</Text>
                            <Text style={[styles.subtitle, { color: theme.muted }]}>
                                {isLoading ? 'Loading students…' : buildSubtitle(students.length, match)}
                            </Text>

                            <View style={styles.benefits}>
                                {BENEFITS.map((benefit) => (
                                    <View key={benefit} style={styles.benefitRow}>
                                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                                        <Text style={[styles.benefitText, { color: theme.text }]}>{benefit}</Text>
                                    </View>
                                ))}
                            </View>

                            {isSaving && progress ? (
                                <View style={styles.progressBlock}>
                                    <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { backgroundColor: theme.primary, width: `${percent}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.progressText, { color: theme.muted }]}>
                                        Saving {progress.done} of {progress.total} · {percent}%
                                    </Text>
                                    <Text style={[styles.progressHint, { color: theme.muted }]}>
                                        Keep this screen open
                                    </Text>
                                </View>
                            ) : (
                                <AppButton
                                    onPress={handleSave}
                                    disabled={isSaving || isLoading || students.length === 0}
                                    loading={isLoading}
                                    icon="people"
                                    fullWidth
                                >
                                    Save All Contacts
                                </AppButton>
                            )}
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

/** Post-run tally. Existing contacts are reported as "updated", never as failures. */
function ResultView({ result, onDone }: { result: BulkSaveResult; onDone: () => void }) {
    const theme = useTheme();

    const rows = [
        { label: 'Newly saved', value: result.created, color: theme.primary },
        { label: 'Updated', value: result.updated, color: theme.info || '#4FACFE' },
        { label: 'Failed', value: result.failed, color: theme.danger },
    ].filter((row) => row.value > 0);

    const isTotalFailure = result.failed === result.total;

    return (
        <>
            <Text style={[styles.title, { color: theme.text }]}>
                {isTotalFailure ? 'Could Not Save' : 'All Done'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
                {isTotalFailure
                    ? 'Check that TrackMyLibrary has Contacts access in your phone settings'
                    : 'Student names will now show on calls and in WhatsApp'}
            </Text>

            <View style={styles.resultBlock}>
                {rows.map((row) => (
                    <View key={row.label} style={styles.resultRow}>
                        <Text style={[styles.resultValue, { color: row.color }]}>{row.value}</Text>
                        <Text style={[styles.resultLabel, { color: theme.muted }]}>{row.label}</Text>
                    </View>
                ))}
            </View>

            {result.failedNames.length > 0 && !isTotalFailure && (
                <View style={[styles.failedBox, { backgroundColor: theme.danger + '10' }]}>
                    <Text style={[styles.failedLabel, { color: theme.danger }]}>Not saved</Text>
                    <Text style={[styles.failedNames, { color: theme.text }]}>
                        {formatFailedNames(result.failedNames)}
                    </Text>
                </View>
            )}

            <AppButton onPress={onDone} fullWidth>
                Done
            </AppButton>
        </>
    );
}

/** List a few failed names, then collapse the rest so the box can't grow unbounded. */
const formatFailedNames = (names: string[]): string => {
    const shown = names.slice(0, MAX_FAILED_NAMES_SHOWN).join(', ');
    const remaining = names.length - MAX_FAILED_NAMES_SHOWN;
    return remaining > 0 ? `${shown} +${remaining} more` : shown;
};

const PROGRESS_BAR_HEIGHT = 6;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    sheet: {
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.xl,
        gap: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '800' },
    subtitle: { fontSize: 13, lineHeight: 18 },
    benefits: { gap: spacing.sm, marginVertical: spacing.sm },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    benefitText: { fontSize: 13, flex: 1 },
    progressBlock: { gap: spacing.sm },
    progressTrack: {
        height: PROGRESS_BAR_HEIGHT,
        borderRadius: PROGRESS_BAR_HEIGHT / 2,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: PROGRESS_BAR_HEIGHT / 2 },
    progressText: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
    progressHint: { fontSize: 11, textAlign: 'center', opacity: 0.7 },
    resultBlock: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: spacing.md,
    },
    resultRow: { alignItems: 'center', gap: 2 },
    resultValue: { fontSize: 26, fontWeight: '800' },
    resultLabel: { fontSize: 11 },
    failedBox: {
        borderRadius: radius.sm,
        padding: spacing.md,
        gap: 4,
        marginBottom: spacing.sm,
    },
    failedLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    failedNames: { fontSize: 13, lineHeight: 18 },
});
