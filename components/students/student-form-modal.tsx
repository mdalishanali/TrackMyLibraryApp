import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppBadge } from '@/components/ui/app-badge';
import { radius, spacing, themeFor, typography } from '@/constants/design';

const studentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    number: z.string().min(8, 'Enter a valid phone'),
    joiningDate: z.string().min(1, 'Joining date is required'),
    seat: z.string().optional(),
    shift: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    fees: z
        .preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().optional())
        .refine((val) => val === undefined || !Number.isNaN(val), { message: 'Enter a valid number' }),
    notes: z.string().optional(),
    status: z.string().min(1, 'Status is required'),
    gender: z.string().min(1, 'Gender is required'),
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

const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
];

const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
];

export function StudentFormModal({
    visible,
    onClose,
    onSubmit,
    initialValues = {
        name: '',
        number: '',
        joiningDate: '',
        seat: '',
        shift: 'Morning',
        startTime: '09:00',
        endTime: '18:00',
        fees: undefined,
        notes: '',
        status: 'Active',
        gender: 'Male',
    },
    seats,
    theme,
    isSubmitting,
    title = 'Add Student',
}: Props) {
    const insets = useSafeAreaInsets();
    const {
        control,
        handleSubmit,
        reset,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: initialValues,
        mode: 'onChange',
        reValidateMode: 'onChange',
    });

    const [currentStep, setCurrentStep] = useState(0);
    const values = watch();
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerType, setTimePickerType] = useState<'start' | 'end' | null>(null);

    useEffect(() => {
        if (visible) {
            const safeInitials = {
                ...initialValues,
                joiningDate: initialValues.joiningDate || '',
                gender: initialValues.gender || 'Male',
                status: initialValues.status || 'Active',
                startTime: initialValues.startTime || '09:00',
                endTime: initialValues.endTime || '18:00',
            };
            reset(safeInitials);
            const parsed = parseDate(safeInitials.joiningDate);
            setValue('joiningDate', safeInitials.joiningDate || parsed.toISOString().split('T')[0]);
            setValue('gender', safeInitials.gender);
            setValue('status', safeInitials.status);
            setValue('startTime', safeInitials.startTime);
            setValue('endTime', safeInitials.endTime);
        } else {
            setCurrentStep(0);
        }
    }, [visible, initialValues, reset, setValue]);

    const steps = useMemo(() => [
        { key: 'basic', title: 'Basic Info', fields: ['name', 'number', 'joiningDate', 'gender'] as (keyof StudentFormValues)[] },
        { key: 'schedule', title: 'Schedule & Fees', fields: ['startTime', 'endTime', 'seat', 'shift', 'fees', 'status'] as (keyof StudentFormValues)[] },
        { key: 'review', title: 'Review', fields: [] as (keyof StudentFormValues)[] },
    ], []);

    const currentStepFields = steps[currentStep]?.fields ?? [];
    const isStepValid = currentStepFields.every((field) => {
        const val = values[field];
        const hasValue = val !== undefined && val !== null && String(val).trim() !== '';
        const hasError = Boolean(errors[field]);
        return hasValue && !hasError;
    });

    const progress = ((currentStep + 1) / steps.length) * 100;

    const seatData = useMemo(
        () => [
            { label: 'Unallocated', value: '' },
            ...seats.map((s) => ({
                label: `Floor ${s.floor ?? '?'} · Seat ${s.seatNumber}`,
                value: s._id,
            })),
        ],
        [seats],
    );

    const handleClose = () => {
        onClose();
        setCurrentStep(0);
    };

    const validateStep = async (index: number) => {
        const fields = steps[index]?.fields ?? [];
        if (!fields.length) return true;
        return trigger(fields as any);
    };

    const handleNext = async () => {
        const ok = await validateStep(currentStep);
        if (!ok) return;
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
    const handleStepTap = async (index: number) => {
        if (index === currentStep) return;
        if (index < currentStep) {
            setCurrentStep(index);
            return;
        }
        const ok = await validateStep(currentStep);
        if (ok) setCurrentStep(index);
    };

    const renderSeatChips = () => (
        <>
            <Text style={[styles.label, { color: theme.text }]}>Seat</Text>
            <Controller
                control={control}
                name="seat"
                render={({ field: { onChange, value } }) => (
                    <Dropdown
                        data={seatData}
                        labelField="label"
                        valueField="value"
                        value={value || ''}
                        onChange={(item) => onChange(item.value || undefined)}
                        placeholder="Select seat"
                        search
                        searchPlaceholder="Search seat or floor"
                        placeholderStyle={{ color: theme.muted }}
                        selectedTextStyle={{ color: theme.text }}
                        itemTextStyle={{ color: theme.text }}
                        style={[
                            styles.dropdown,
                            {
                                backgroundColor: theme.surface,
                                borderColor: errors.seat ? '#ef4444' : theme.border,
                            },
                        ]}
                        containerStyle={{ backgroundColor: theme.surface }}
                        activeColor={theme.primarySoft}
                    />
                )}
            />
            {errors.seat?.message ? (
                <Text style={styles.errorText}>{String(errors.seat.message)}</Text>
            ) : null}
        </>
    );

    const renderReview = () => (
        <AppCard padded style={[styles.reviewCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.reviewTitle, { color: theme.text }]}>{title}</Text>
            <View style={styles.reviewRow}>
                <InfoPill label="Name" value={values.name || '—'} theme={theme} />
                <InfoPill label="Phone" value={values.number || '—'} theme={theme} />
            </View>
            <View style={styles.reviewRow}>
                <InfoPill label="Joining" value={values.joiningDate || '—'} theme={theme} />
                <InfoPill label="Seat" value={values.seat ? seats.find(s => s._id === values.seat)?.seatNumber : 'Unallocated'} theme={theme} />
            </View>
            <View style={styles.reviewRow}>
                <InfoPill label="Time" value={`${values.startTime} - ${values.endTime}`} theme={theme} />
                <InfoPill label="Fees" value={values.fees ?? '—'} theme={theme} />
            </View>
            <InfoPill label="Notes" value={values.notes || '—'} theme={theme} />
        </AppCard>
    );

    const handleFinalSubmit = handleSubmit(async (vals) => {
        await onSubmit(vals);
        reset(initialValues);
        setCurrentStep(0);
    });

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={handleClose}>
            <SafeScreen>
                <ScrollView
                    style={[styles.modalContainer, { backgroundColor: theme.background }]}
                contentContainerStyle={{
                    padding: spacing.lg,
                    paddingTop: spacing.lg + insets.top,
                    gap: spacing.lg,
                }}
            >
                <View style={styles.modalTopBar}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={[styles.iconButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="close" size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <AppCard padded style={[styles.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>Step {currentStep + 1}</Text>
                            <Text style={{ color: theme.muted, fontSize: typography.size.sm }}>{steps[currentStep]?.title}</Text>
                        </View>
                        <AppBadge tone="info">{Math.round(progress)}% done</AppBadge>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.text }]} />
                    </View>
                    <View style={styles.stepHeader}>
                        {steps.map((step, idx) => {
                            const active = idx === currentStep;
                            const completed = idx < currentStep;
                            return (
                                <TouchableOpacity
                                    key={step.key}
                                    style={[
                                        styles.stepItem,
                                        { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
                                        active && { borderColor: theme.text },
                                    ]}
                                    onPress={() => handleStepTap(idx)}
                                >
                                    <View
                                        style={[
                                            styles.stepCircle,
                                            {
                                                backgroundColor: active || completed ? theme.text : theme.surface,
                                                borderColor: active ? theme.text : theme.border,
                                            },
                                        ]}
                                    >
                                        <Text style={{ color: active || completed ? theme.surface : theme.muted, fontWeight: '800' }}>
                                            {idx + 1}
                                        </Text>
                                    </View>
                                    <Text style={[styles.stepLabel, { color: active ? theme.text : theme.muted }]} numberOfLines={1}>
                                        {step.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </AppCard>

                    <AppCard padded style={[styles.sectionCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                        {currentStep === 0 && (
                            <>
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
                    keyboardType="phone-pad"
                    placeholder="Enter phone"
                />
                                <FormField
                                    label="Joining Date (YYYY-MM-DD)"
                                    name="joiningDate"
                                    control={control}
                                    errors={errors}
                                    theme={theme}
                                    placeholder="YYYY-MM-DD"
                                    renderInput={({ value, hasError }) => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setDatePickerOpen(true);
                                            }}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: theme.surface,
                                                    borderColor: hasError ? '#ef4444' : theme.border,
                                                },
                                            ]}
                                        >
                                            <Text style={{ color: value ? theme.text : theme.muted }}>
                                                {value || 'Select date'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                                <Controller
                                    control={control}
                                    name="gender"
                                    render={({ field: { onChange, value } }) => (
                <Dropdown
                    data={genderOptions}
                    labelField="label"
                    valueField="value"
                    value={value || ''}
                    onChange={(item) => onChange(item.value)}
                    placeholder="Select gender"
                    placeholderStyle={{ color: theme.muted }}
                    selectedTextStyle={{ color: theme.text }}
                    itemTextStyle={{ color: theme.text }}
                    style={[
                        styles.dropdown,
                        {
                            backgroundColor: theme.surface,
                            borderColor: errors.gender ? '#ef4444' : theme.border,
                        },
                    ]}
                    containerStyle={{ backgroundColor: theme.surface }}
                    activeColor={theme.primarySoft}
                />
                                    )}
                                />
                                {errors.gender?.message ? (
                                    <Text style={styles.errorText}>{String(errors.gender.message)}</Text>
                                ) : null}
                                <FormField
                                    label="Notes (Optional)"
                                    name="notes"
                                    control={control}
                                    errors={errors}
                                    theme={theme}
                                />
                            </>
                        )}

                        {currentStep === 1 && (
                            <>
                                {renderSeatChips()}
                                <FormField
                                    label="Start Time (HH:mm)"
                                    name="startTime"
                                    control={control}
                                    errors={errors}
                                    theme={theme}
                                    renderInput={({ value, hasError }) => (
                                        <TouchableOpacity
                                            onPress={() => setTimePickerType('start')}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: theme.surface,
                                                    borderColor: hasError ? '#ef4444' : theme.border,
                                                },
                                            ]}
                                        >
                                            <Text style={{ color: value ? theme.text : theme.muted }}>
                                                {toDisplayTime(value) || 'Select time'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                {errors.startTime?.message ? (
                                    <Text style={styles.errorText}>{String(errors.startTime.message)}</Text>
                                ) : null}
                                <FormField
                                    label="End Time (HH:mm)"
                                    name="endTime"
                                    control={control}
                                    errors={errors}
                                    theme={theme}
                                    renderInput={({ value, hasError }) => (
                                        <TouchableOpacity
                                            onPress={() => setTimePickerType('end')}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: theme.surface,
                                                    borderColor: hasError ? '#ef4444' : theme.border,
                                                },
                                            ]}
                                        >
                                            <Text style={{ color: value ? theme.text : theme.muted }}>
                                                {toDisplayTime(value) || 'Select time'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                {errors.endTime?.message ? (
                                    <Text style={styles.errorText}>{String(errors.endTime.message)}</Text>
                                ) : null}
                                <View style={{ gap: spacing.xs }}>
                                    <Text style={[styles.label, { color: theme.text }]}>Status</Text>
                                    <Dropdown
                                        data={statusOptions}
                                        labelField="label"
                                        valueField="value"
                                        value={values.status || 'Active'}
                                        onChange={(item) => setValue('status', item.value)}
                                        placeholder="Select status"
                                        placeholderStyle={{ color: theme.muted }}
                                        selectedTextStyle={{ color: theme.text }}
                                        itemTextStyle={{ color: theme.text }}
                                        style={[
                                            styles.dropdown,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: errors.status ? '#ef4444' : theme.border,
                                            },
                                        ]}
                                        containerStyle={{ backgroundColor: theme.surface }}
                                        activeColor={theme.primarySoft}
                                    />
                                    <Text style={[styles.hintText, { color: theme.muted }]}>
                                        Set to inactive to pause notifications and billing.
                                    </Text>
                                    {errors.status?.message ? (
                                        <Text style={styles.errorText}>{String(errors.status.message)}</Text>
                                    ) : null}
                                </View>
                                <FormField
                                    label="Fees (₹) (Optional)"
                                    name="fees"
                                    control={control}
                                    errors={errors}
                                    theme={theme}
                                    keyboardType="numeric"
                                    placeholder="Leave blank if free"
                                />
                                <Text style={[styles.hintText, { color: theme.muted, marginTop: -spacing.sm }]}>
                                    Fees are optional. Keep it empty for free seats.
                                </Text>
                            </>
                        )}

                        {currentStep === 2 && renderReview()}
                    </AppCard>

                    <View style={styles.modalActions}>
                        <AppButton variant="outline" onPress={handleClose}>
                            Cancel
                        </AppButton>
                        {currentStep > 0 ? (
                            <AppButton variant="outline" onPress={handlePrev} tone="neutral">
                                Back
                            </AppButton>
                        ) : null}
                        {currentStep < steps.length - 1 ? (
                            <AppButton onPress={handleNext} disabled={!isStepValid}>
                                Next
                            </AppButton>
                        ) : (
                            <AppButton onPress={handleFinalSubmit} loading={isSubmitting} disabled={!isStepValid}>
                                Save
                            </AppButton>
                        )}
                    </View>
                </ScrollView>

                {datePickerOpen && (
                    <Modal transparent visible={datePickerOpen} animationType="fade">
                        <View style={styles.overlay}>
                            <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                                <DateTimePicker
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    value={parseDate(values.joiningDate)}
                                    onChange={(e, d) => {
                                        if (d) {
                                            const iso = d.toISOString().split('T')[0];
                                            setValue('joiningDate', iso);
                                        }
                                        setDatePickerOpen(false);
                                    }}
                                />
                                <AppButton variant="outline" onPress={() => setDatePickerOpen(false)}>Done</AppButton>
                            </View>
                        </View>
                    </Modal>
                )}

                {timePickerType && (
                    <Modal transparent visible animationType="fade">
                        <View style={styles.overlay}>
                            <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                                <DateTimePicker
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    value={parseTime(values[timePickerType])}
                                    onChange={(e, d) => {
                                        if (d) {
                                            const h = String(d.getHours()).padStart(2, '0');
                                            const m = String(d.getMinutes()).padStart(2, '0');
                                            const v = `${h}:${m}`;
                                            setValue(timePickerType, v);
                                        }
                                        setTimePickerType(null);
                                    }}
                                />
                                <AppButton variant="outline" onPress={() => setTimePickerType(null)}>Done</AppButton>
                            </View>
                        </View>
                    </Modal>
                )}
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
    placeholder?: string;
    renderInput?: ({ value, onPress, hasError }: { value: string | number | undefined; onPress?: () => void; hasError: boolean }) => JSX.Element;
};

function FormField({
    label,
    name,
    control,
    errors,
    theme,
    keyboardType = 'default',
    placeholder,
    renderInput,
}: FormFieldProps) {
    const errorEntry = errors[name];
    const errorMessage =
        typeof errorEntry?.message === 'string'
            ? errorEntry.message
            : errorEntry?.types
              ? String(Object.values(errorEntry.types)[0])
              : undefined;
    const hasError = Boolean(errorMessage);
    return (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={[styles.label, { color: theme.text }]}>
                {label}
                {!label.toLowerCase().includes('(optional)') ? ' *' : ''}
            </Text>
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) =>
                    renderInput ? (
                        renderInput({ value, onPress: () => onChange(value), hasError })
                    ) : (
                        <TextInput
                            value={value === undefined || value === null ? '' : String(value)}
                            onChangeText={onChange}
                            placeholder={placeholder || label}
                            placeholderTextColor={theme.muted}
                            keyboardType={keyboardType}
                            style={[
                                styles.input,
                                {
                                    borderColor: hasError ? '#ef4444' : theme.border,
                                    color: theme.text,
                                    backgroundColor: theme.surface,
                                },
                            ]}
                        />
                    )
                }
            />
            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
        </View>
    );
}

const InfoPill = ({ label, value, theme }: { label: string; value: string | number; theme: ReturnType<typeof themeFor> }) => (
    <View style={[styles.infoPill, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
);

const parseTime = (t?: string | null) => {
    const [h, m] = (t || '09:00').split(':');
    const d = new Date();
    d.setHours(Number(h) || 9);
    d.setMinutes(Number(m) || 0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
};

const toDisplayTime = (time?: string) => {
    if (!time) return '';
    const [hStr, mStr] = time.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    const paddedMin = String(m).padStart(2, '0');
    return `${hour12}:${paddedMin} ${suffix}`;
};

const parseDate = (value?: string) => {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return new Date();
    return d;
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    heroCard: {
        gap: spacing.md,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md,
    },
    modalTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    modalTitle: {
        fontSize: typography.size.lg,
        fontWeight: '700',
    },
    stepTitle: {
        fontSize: typography.size.lg,
        fontWeight: '700',
    },
    label: {
        fontSize: typography.size.sm,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
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
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.lg,
        borderWidth: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    stepItem: {
        alignItems: 'center',
        gap: spacing.xs / 2,
        flex: 1,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    stepCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLabel: {
        fontSize: typography.size.xs,
        textAlign: 'center',
    },
    reviewCard: {
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
    },
    reviewTitle: {
        fontSize: typography.size.lg,
        fontWeight: '700',
    },
    sectionCard: {
        gap: spacing.md,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    infoPill: {
        flex: 1,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.sm,
    },
    infoLabel: {
        fontSize: typography.size.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    infoValue: {
        fontSize: typography.size.md,
        fontWeight: '700',
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    pickerBox: {
        width: '100%',
        borderRadius: radius.lg,
        padding: spacing.md,
    },
    hintText: {
        fontSize: typography.size.xs,
    },
});
