import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { z } from 'zod';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { radius, spacing, themeFor, typography } from '@/constants/design';

const paymentSchema = z.object({
    student: z.string().min(1),
    rupees: z.preprocess((val) => Number(val), z.number().min(1)),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    paymentMode: z.enum(['cash', 'upi']),
    paymentDate: z.string().min(1),
    notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (values: PaymentFormValues) => void | Promise<void>;
    initialValues: PaymentFormValues;
    theme: ReturnType<typeof themeFor>;
    isSubmitting: boolean;
    disabled?: boolean;
};

export function PaymentFormModal({
    visible,
    onClose,
    onSubmit,
    initialValues,
    theme,
    isSubmitting,
    disabled,
}: Props) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
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
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Record Payment</Text>

                    <FormField
                        label="Student ID"
                        name="student"
                        control={control}
                        errors={errors}
                        theme={theme}
                        readOnly
                    />
                    <FormField
                        label="Amount (₹)"
                        name="rupees"
                        control={control}
                        errors={errors}
                        theme={theme}
                        keyboardType="numeric"
                    />
                    <FormField
                        label="Start Date (YYYY-MM-DD)"
                        name="startDate"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="End Date (YYYY-MM-DD)"
                        name="endDate"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Payment Mode (cash|upi)"
                        name="paymentMode"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Payment Date (YYYY-MM-DD)"
                        name="paymentDate"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />
                    <FormField
                        label="Notes"
                        name="notes"
                        control={control}
                        errors={errors}
                        theme={theme}
                    />

                    <View style={styles.modalActions}>
                        <AppButton variant="outline" onPress={handleClose}>
                            Cancel
                        </AppButton>
                        <AppButton
                            onPress={handleSubmit(onSubmit)}
                            loading={isSubmitting}
                            disabled={disabled}
                        >
                            Save Payment
                        </AppButton>
                    </View>
                </ScrollView>
            </SafeScreen>
        </Modal>
    );
}

type FormFieldProps = {
    label: string;
    name: keyof PaymentFormValues;
    control: any;
    errors: any;
    theme: ReturnType<typeof themeFor>;
    keyboardType?: 'default' | 'numeric';
    readOnly?: boolean;
};

function FormField({
    label,
    name,
    control,
    errors,
    theme,
    keyboardType = 'default',
    readOnly = false,
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
                        editable={!readOnly}
                        style={[
                            styles.input,
                            {
                                borderColor: theme.border,
                                color: theme.text,
                                backgroundColor: theme.surfaceAlt,
                                opacity: readOnly ? 0.6 : 1,
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
});
