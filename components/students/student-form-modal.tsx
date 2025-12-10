import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { z } from 'zod';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, themeFor, typography } from '@/constants/design';

const studentSchema = z.object({
    name: z.string().min(1),
    number: z.string().min(8),
    joiningDate: z.string().min(1),
    seat: z.string().optional(),
    shift: z.string().optional(),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    fees: z.preprocess((val) => Number(val), z.number().optional()),
    notes: z.string().optional(),
    status: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

type SeatOption = {
    _id: string;
    seatNumber: string;
    floor?: number | string;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (values: StudentFormValues) => void | Promise<void>;
    initialValues: StudentFormValues;
    seats: SeatOption[];
    theme: ReturnType<typeof themeFor>;
    isSubmitting: boolean;
    title?: string;
};

export function StudentFormModal({
    visible,
    onClose,
    onSubmit,
    initialValues,
    seats,
    theme,
    isSubmitting,
    title = 'Add Student',
}: Props) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: initialValues,
    });

    useEffect(() => {
        if (visible) {
            reset(initialValues);
        }
    }, [visible, initialValues, reset]);

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={handleClose}>
            <SafeScreen>
                <ScrollView
                    style={[styles.modalContainer, { backgroundColor: theme.background }]}
                    contentContainerStyle={{ padding: spacing.lg }}
                >
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>

                    <FormField
                        label="Name"
                        name="name"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Phone"
                        name="number"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Joining Date (YYYY-MM-DD)"
                        name="joiningDate"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Start Time (HH:mm)"
                        name="startTime"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="End Time (HH:mm)"
                        name="endTime"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Fees (₹)"
                        name="fees"
                        control={control}
                        errors={errors}
                        theme={theme}
                        keyboardType="numeric"
                    />
                    <FormField
                        label="Notes"
                        name="notes"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Seat</Text>
                    <Controller
                        control={control}
                        name="seat"
                        render={({ field: { onChange, value } }) => (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: spacing.sm }}
                            >
                                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: !value ? theme.primarySoft : theme.surface,
                                                borderColor: theme.border,
                                            },
                                        ]}
                                        onPress={() => onChange(undefined)}
                                    >
                                        <Text style={{ color: theme.text }}>Unallocated</Text>
                                    </TouchableOpacity>
                                    {seats.map((seat) => (
                                        <TouchableOpacity
                                            key={seat._id}
                                            style={[
                                                styles.chip,
                                                {
                                                    backgroundColor: value === seat._id ? theme.primary : theme.surface,
                                                    borderColor: theme.border,
                                                },
                                            ]}
                                            onPress={() => onChange(seat._id)}
                                        >
                                            <Text
                                                style={{
                                                    color: value === seat._id ? '#fff' : theme.text,
                                                    fontWeight: '600',
                                                }}
                                            >
                                                Floor {seat.floor ?? '?'} · Seat {seat.seatNumber}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                    />
                    {errors.seat?.message ? (
                        <Text style={styles.errorText}>{String(errors.seat.message)}</Text>
                    ) : null}

                    <View style={styles.modalActions}>
                        <AppButton variant="outline" onPress={handleClose}>
                            Cancel
                        </AppButton>
                        <AppButton
                            onPress={handleSubmit(onSubmit)}
                            loading={isSubmitting}
                        >
                            Save
                        </AppButton>
                    </View>
                </ScrollView>
            </SafeScreen>
        </Modal>
    );
}

type FormFieldProps = {
    label: string;
    name: keyof StudentFormValues;
    control: any;
    errors: any;
    theme: ReturnType<typeof themeFor>;
    keyboardType?: 'default' | 'numeric';
};

function FormField({
    label,
    name,
    control,
    errors,
    theme,
    keyboardType = 'default',
}: FormFieldProps) {
    return (
        <View style={{ marginBottom: spacing.sm }}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        value={value === undefined || value === null ? '' : String(value)}
                        onChangeText={onChange}
                        placeholder={label}
                        placeholderTextColor={theme.muted}
                        keyboardType={keyboardType}
                        style={[
                            styles.input,
                            {
                                borderColor: theme.border,
                                color: theme.text,
                                backgroundColor: theme.surfaceAlt,
                            },
                        ]}
                    />
                )}
            />
            {errors[name]?.message ? (
                <Text style={styles.errorText}>{String(errors[name].message)}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: typography.size.xl,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    label: {
        fontSize: typography.size.sm,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.size.md,
    },
    errorText: {
        color: 'red',
        marginTop: 4,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    chip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.lg,
        borderWidth: 1,
    },
});
