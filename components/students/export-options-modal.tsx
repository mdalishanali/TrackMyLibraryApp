import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { radius, spacing } from '@/constants/design';
import {
    ALL_COLUMN_KEYS,
    AUDIENCE_OPTIONS,
    ColumnPreset,
    EXPORT_COLUMNS,
    MIN_SELECTED_COLUMNS,
    STANDARD_COLUMN_KEYS,
    StudentAudience,
} from '@/constants/student-export';
import { ExportStudentsParams, fetchExportCount } from '@/hooks/use-export-students';
import { useTheme } from '@/hooks/use-theme';

/**
 * export-options-modal.tsx
 *
 * Lets the owner choose WHO is exported and WHICH columns before the file is built.
 *
 * The count is fetched from the export endpoint itself rather than derived from any
 * list already on screen: the preview and the download then come from one match, so
 * "142 students" is always what lands in the file.
 */

interface ExportOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (options: { status: StudentAudience; columns: string[] }) => void;
    /** Filters from the calling screen, folded into the count query. */
    baseParams?: ExportStudentsParams;
    isExporting?: boolean;
}

/** Column names read back in the canonical order, whatever order they were ticked. */
const describeColumns = (keys: string[]): string =>
    EXPORT_COLUMNS.filter((column) => keys.includes(column.key))
        .map((column) => column.label)
        .join(' · ');

const PRESET_OPTIONS: { value: ColumnPreset; label: string; hint: string }[] = [
    {
        value: 'standard',
        label: 'Standard',
        hint: describeColumns(STANDARD_COLUMN_KEYS),
    },
    {
        value: 'all',
        label: 'Everything',
        hint: `All ${ALL_COLUMN_KEYS.length} columns, including address and ID details`,
    },
    { value: 'custom', label: 'Choose columns', hint: 'Pick exactly what you need' },
];

const resolveColumns = (preset: ColumnPreset, custom: string[]): string[] => {
    if (preset === 'standard') return STANDARD_COLUMN_KEYS;
    if (preset === 'all') return ALL_COLUMN_KEYS;

    return custom;
};

export function ExportOptionsModal({
    visible,
    onClose,
    onConfirm,
    baseParams,
    isExporting = false,
}: ExportOptionsModalProps) {
    const theme = useTheme();

    const [audience, setAudience] = useState<StudentAudience>('all');
    const [preset, setPreset] = useState<ColumnPreset>('standard');
    const [customKeys, setCustomKeys] = useState<string[]>(STANDARD_COLUMN_KEYS);
    const [count, setCount] = useState<number | null>(null);

    const columns = useMemo(() => resolveColumns(preset, customKeys), [preset, customKeys]);

    const hasEnoughColumns = columns.length >= MIN_SELECTED_COLUMNS;

    // Re-count whenever the audience changes. Column choice does not affect how many
    // students match, so it deliberately does not retrigger the query.
    useEffect(() => {
        if (!visible) return;

        let isActive = true;
        setCount(null);

        fetchExportCount({ ...baseParams, status: audience })
            .then((next) => {
                if (isActive) setCount(next);
            })
            .catch(() => {
                // A failed preview must not block the export — the count is a hint.
                if (isActive) setCount(null);
            });

        return () => {
            isActive = false;
        };
        // baseParams is a fresh object each render on some callers; the fields that
        // matter are stable for the life of the sheet.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, audience]);

    const isEveryColumnSelected = customKeys.length === EXPORT_COLUMNS.length;

    const toggleColumn = (key: string) => {
        setCustomKeys((previous) =>
            previous.includes(key)
                ? previous.filter((existing) => existing !== key)
                : [...previous, key]
        );
    };

    const toggleAllColumns = () => {
        setCustomKeys(isEveryColumnSelected ? [] : ALL_COLUMN_KEYS);
    };

    /**
     * Entering "Choose columns" seeds the ticks from the preset that was showing, so
     * the list opens on what the owner was already about to export rather than on a
     * selection left over from an earlier visit.
     */
    const handlePresetChange = (next: ColumnPreset) => {
        if (next === 'custom') {
            setCustomKeys(resolveColumns(preset, customKeys));
        }

        setPreset(next);
    };

    const handleConfirm = () => {
        if (!hasEnoughColumns) return;

        onConfirm({ status: audience, columns });
    };

    const countLabel = count === null ? 'Counting…' : `${count} student${count === 1 ? '' : 's'}`;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: theme.text }]}>Export Students</Text>
                            <Text style={[styles.subtitle, { color: theme.muted }]}>
                                Choose what goes into your CSV
                            </Text>
                        </View>
                        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
                            <Ionicons name="close" size={22} color={theme.muted} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.sectionLabel, { color: theme.muted }]}>WHICH STUDENTS</Text>
                        {AUDIENCE_OPTIONS.map((option) => {
                            const isSelected = audience === option.value;

                            return (
                                <Pressable
                                    key={option.value}
                                    onPress={() => setAudience(option.value)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: isSelected }}
                                    style={[
                                        styles.option,
                                        {
                                            borderColor: isSelected ? theme.primary : theme.border,
                                            backgroundColor: isSelected ? theme.primary + '10' : 'transparent',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={isSelected ? theme.primary : theme.muted}
                                    />
                                    <View style={styles.optionText}>
                                        <Text style={[styles.optionLabel, { color: theme.text }]}>
                                            {option.label}
                                        </Text>
                                        <Text style={[styles.optionHint, { color: theme.muted }]}>
                                            {option.description}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}

                        <Text style={[styles.sectionLabel, { color: theme.muted, marginTop: spacing.lg }]}>
                            COLUMNS
                        </Text>
                        {PRESET_OPTIONS.map((option) => {
                            const isSelected = preset === option.value;

                            return (
                                <Pressable
                                    key={option.value}
                                    onPress={() => handlePresetChange(option.value)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: isSelected }}
                                    style={[
                                        styles.option,
                                        {
                                            borderColor: isSelected ? theme.primary : theme.border,
                                            backgroundColor: isSelected ? theme.primary + '10' : 'transparent',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={isSelected ? theme.primary : theme.muted}
                                    />
                                    <View style={styles.optionText}>
                                        <Text style={[styles.optionLabel, { color: theme.text }]}>
                                            {option.label}
                                        </Text>
                                        <Text style={[styles.optionHint, { color: theme.muted }]}>
                                            {option.hint}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}

                        {preset === 'custom' && (
                            <>
                                <View style={styles.columnListHeader}>
                                    <Text style={[styles.columnCount, { color: theme.muted }]}>
                                        {customKeys.length} of {EXPORT_COLUMNS.length} selected
                                    </Text>
                                    <Pressable onPress={toggleAllColumns} hitSlop={8}>
                                        <Text style={[styles.bulkAction, { color: theme.primary }]}>
                                            {isEveryColumnSelected ? 'Clear all' : 'Select all'}
                                        </Text>
                                    </Pressable>
                                </View>
                                <View style={styles.columnList}>
                                {EXPORT_COLUMNS.map((column) => {
                                    const isChecked = customKeys.includes(column.key);

                                    return (
                                        <Pressable
                                            key={column.key}
                                            onPress={() => toggleColumn(column.key)}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: isChecked }}
                                            style={styles.columnRow}
                                        >
                                            <Ionicons
                                                name={isChecked ? 'checkbox' : 'square-outline'}
                                                size={20}
                                                color={isChecked ? theme.primary : theme.muted}
                                            />
                                            <Text style={[styles.columnLabel, { color: theme.text }]}>
                                                {column.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={[styles.summary, { borderTopColor: theme.border }]}>
                        <Text style={[styles.summaryText, { color: theme.muted }]}>
                            {countLabel} · {columns.length} column{columns.length === 1 ? '' : 's'}
                        </Text>
                        {!hasEnoughColumns && (
                            <Text style={[styles.warning, { color: theme.danger }]}>
                                Pick at least one column
                            </Text>
                        )}
                    </View>

                    <AppButton
                        onPress={handleConfirm}
                        disabled={!hasEnoughColumns || isExporting}
                        loading={isExporting}
                        icon="download-outline"
                        fullWidth
                    >
                        Export CSV
                    </AppButton>
                </View>
            </View>
        </Modal>
    );
}

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
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    headerText: { flex: 1, gap: 2 },
    title: { fontSize: 20, fontWeight: '800' },
    subtitle: { fontSize: 13 },
    // flexShrink lets the list give up height to the pinned summary and button
    // instead of clipping; flexGrow:0 here would collapse it and hide the columns.
    body: { flexShrink: 1 },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    optionText: { flex: 1, gap: 2 },
    optionLabel: { fontSize: 15, fontWeight: '700' },
    optionHint: { fontSize: 12 },
    columnListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    columnCount: { fontSize: 12, fontWeight: '700' },
    bulkAction: { fontSize: 12, fontWeight: '800' },
    columnList: { gap: spacing.xs },
    columnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    columnLabel: { fontSize: 14 },
    summary: {
        borderTopWidth: 1,
        paddingTop: spacing.md,
        gap: 2,
    },
    summaryText: { fontSize: 13, fontWeight: '600' },
    warning: { fontSize: 12, fontWeight: '600' },
});
