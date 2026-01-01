import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Image } from 'expo-image';
import { pickOrCaptureImage, uploadImageToCloud } from '@/utils/image';
import { ImagePickerSheet } from '../ui/image-picker-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

import { SafeScreen } from '@/components/layout/safe-screen';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppBadge } from '@/components/ui/app-badge';
import { radius, spacing, themeFor, typography } from '@/constants/design';
import { formatDate } from '@/utils/format';

const studentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    number: z.string().min(8, 'Enter a valid phone'),
    joiningDate: z.string().min(1, 'Joining date is required'),
    seat: z.string().optional(),
    shift: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    fees: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().min(1, 'Status is required'),
    gender: z.string().min(1, 'Gender is required'),
    profilePicture: z.string().optional(),
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
    onSubmit: (values: StudentFormValues, onProgress?: (p: number) => void) => void | Promise<void>;
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
    initialValues,
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
    });

    const [currentStep, setCurrentStep] = useState(0);
    const values = watch();
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerType, setTimePickerType] = useState<'startTime' | 'endTime' | null>(null);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [pickerSheetVisible, setPickerSheetVisible] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [backgroundProgress, setBackgroundProgress] = useState(0);

    const handleImagePick = async (source: 'gallery' | 'camera') => {
        setIsImageProcessing(true);
        setPickerSheetVisible(false);
        try {
            const result = await pickOrCaptureImage(source);
            if (result) {
                setIsUploading(true);
                setBackgroundProgress(0.1);
                try {
                    const cloudUrl = await uploadImageToCloud(result.uri, (p) => {
                        setBackgroundProgress(p);
                    });
                    setValue('profilePicture', cloudUrl);
                } catch (err) {
                    Alert.alert('Upload Failed', 'Could not upload image to server.');
                } finally {
                    setIsUploading(false);
                    setBackgroundProgress(0);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to process image');
        } finally {
            setIsImageProcessing(false);
        }
    };

    useEffect(() => {
        if (visible) {
            reset(initialValues);
        } else {
            setCurrentStep(0);
        }
    }, [visible, initialValues, reset]);

    const steps = useMemo(() => [
        { key: 'basic', title: 'Basic Info', fields: ['name', 'number', 'joiningDate', 'gender'] as (keyof StudentFormValues)[] },
        { key: 'schedule', title: 'Schedule & Fees', fields: ['startTime', 'endTime', 'seat', 'shift', 'status'] as (keyof StudentFormValues)[] },
        { key: 'review', title: 'Review', fields: [] as (keyof StudentFormValues)[] },
    ], []);

    const progress = ((currentStep + 1) / steps.length) * 100;

    const seatData = useMemo(() => [
        { label: 'Unallocated', value: '' },
        ...seats.map((s) => ({
            label: `Floor ${s.floor ?? '?'} · Seat ${s.seatNumber}`,
            value: s._id,
        })),
    ], [seats]);

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

    const handleFinalSubmit = handleSubmit(async (vals) => {
        try {
            await onSubmit(vals, (p) => setUploadProgress(p));
            reset(initialValues);
            setCurrentStep(0);
        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setUploadProgress(0);
        }
    });

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={handleClose} transparent>
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <LinearGradient
                    colors={[theme.primary + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={{ flex: 1 }}>
                        <View style={[
                            styles.modalTopBar,
                            {
                                paddingHorizontal: spacing.lg,
                                paddingTop: insets.top + spacing.xs,
                                paddingBottom: spacing.sm,
                            }
                        ]}>
                            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Ionicons name="close" size={20} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        <View style={styles.stepperContainer}>
                            <View style={styles.stepHeaders}>
                                {steps.map((step, idx) => {
                                    const active = idx === currentStep;
                                    const completed = idx < currentStep;
                                    return (
                                        <View key={step.key} style={styles.stepHeaderItem}>
                                            <View style={[
                                                styles.stepCircle,
                                                {
                                                    backgroundColor: active || completed ? theme.primary : theme.surface,
                                                    borderColor: active ? theme.primary : theme.border
                                                }
                                            ]}>
                                                {completed ? (
                                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                                ) : (
                                                    <Text style={[styles.stepNumber, { color: active ? '#fff' : theme.muted }]}>{idx + 1}</Text>
                                                )}
                                            </View>
                                            <Text style={[styles.stepLabel, { color: active ? theme.text : theme.muted }]}>
                                                {step.title}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                                <Animated.View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
                            </View>
                        </View>

                        <ScrollView
                            style={styles.modalScroll}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <Animated.View
                                key={currentStep}
                                entering={SlideInRight.duration(400)}
                                exiting={SlideOutLeft.duration(400)}
                            >
                                {currentStep === 0 && (
                                    <View style={styles.stepContent}>
                                        <TouchableOpacity
                                            onPress={() => setPickerSheetVisible(true)}
                                            style={[styles.imagePicker, { borderColor: theme.primary, backgroundColor: theme.surface }]}
                                        >
                                            {values.profilePicture ? (
                                                <Image source={{ uri: values.profilePicture }} style={styles.previewImage} contentFit="cover" />
                                            ) : (
                                                <View style={styles.placeholderContainer}>
                                                    <Ionicons name="camera-outline" size={32} color={theme.primary} />
                                                    <Text style={[styles.placeholderText, { color: theme.primary }]}>Add Photo</Text>
                                                </View>
                                            )}
                                            {(isImageProcessing || isUploading) && (
                                                <View style={styles.imageOverlay}>
                                                    <ActivityIndicator color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        <AppCard style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <FormField label="Full Name" name="name" control={control} errors={errors} theme={theme} placeholder="Enter member's full name" />
                                            <FormField label="Phone Number" name="number" control={control} errors={errors} theme={theme} keyboardType="phone-pad" placeholder="98765 43210" />

                                            <View style={styles.formGroup}>
                                                <Text style={[styles.label, { color: theme.text }]}>Joining Date</Text>
                                                <TouchableOpacity
                                                    onPress={() => setDatePickerOpen(true)}
                                                    style={[styles.input, { borderColor: errors.joiningDate ? theme.danger : theme.border, backgroundColor: theme.surfaceAlt }]}
                                                >
                                                    <Text style={{ color: values.joiningDate ? theme.text : theme.muted, fontSize: 16, fontWeight: '600' }}>
                                                        {values.joiningDate ? formatDate(values.joiningDate) : 'Select date'}
                                                    </Text>
                                                    <Ionicons name="calendar-outline" size={18} color={theme.muted} />
                                                </TouchableOpacity>
                                                {errors.joiningDate?.message && <Text style={styles.errorText}>{String(errors.joiningDate.message)}</Text>}
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                                                <Dropdown
                                                    data={genderOptions}
                                                    labelField="label"
                                                    valueField="value"
                                                    value={values.gender}
                                                    onChange={(item) => setValue('gender', item.value)}
                                                    style={[styles.dropdown, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                                                    placeholderStyle={{ color: theme.muted }}
                                                    selectedTextStyle={{ color: theme.text }}
                                                    itemTextStyle={{ color: theme.text }}
                                                    containerStyle={{ backgroundColor: theme.surface }}
                                                    activeColor={theme.primary + '10'}
                                                />
                                            </View>
                                        </AppCard>
                                    </View>
                                )}

                                {currentStep === 1 && (
                                    <View style={styles.stepContent}>
                                        <AppCard style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={styles.row}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.label, { color: theme.text }]}>Start Time</Text>
                                                    <TouchableOpacity
                                                        onPress={() => setTimePickerType('startTime')}
                                                        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                                                    >
                                                        <Text style={{ color: theme.text, fontWeight: '600' }}>{toDisplayTime(values.startTime)}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.label, { color: theme.text }]}>End Time</Text>
                                                    <TouchableOpacity
                                                        onPress={() => setTimePickerType('endTime')}
                                                        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                                                    >
                                                        <Text style={{ color: theme.text, fontWeight: '600' }}>{toDisplayTime(values.endTime)}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={[styles.label, { color: theme.text }]}>Seat Allocation</Text>
                                                <Dropdown
                                                    data={seatData}
                                                    labelField="label"
                                                    valueField="value"
                                                    value={values.seat}
                                                    search
                                                    searchPlaceholder="Search seat..."
                                                    onChange={(item) => setValue('seat', item.value)}
                                                    style={[styles.dropdown, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                                                    placeholderStyle={{ color: theme.muted }}
                                                    selectedTextStyle={{ color: theme.text }}
                                                    itemTextStyle={{ color: theme.text }}
                                                    containerStyle={{ backgroundColor: theme.surface }}
                                                    activeColor={theme.primary + '10'}
                                                />
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={[styles.label, { color: theme.text }]}>Current Status</Text>
                                                <View style={styles.statusGrid}>
                                                    {statusOptions.map(opt => {
                                                        const active = values.status === opt.value;
                                                        return (
                                                            <TouchableOpacity
                                                                key={opt.value}
                                                                onPress={() => setValue('status', opt.value)}
                                                                style={[
                                                                    styles.statusBtn,
                                                                    {
                                                                        backgroundColor: active ? theme.primary : theme.surfaceAlt,
                                                                        borderColor: active ? theme.primary : theme.border
                                                                    }
                                                                ]}
                                                            >
                                                                <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '800' }}>{opt.label}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>

                                            <FormField label="Monthly Fees (₹)" name="fees" control={control} errors={errors} theme={theme} keyboardType="numeric" placeholder="e.g. 500" />
                                            <FormField label="Internal Notes" name="notes" control={control} errors={errors} theme={theme} placeholder="Add any special instructions..." multiline />
                                        </AppCard>
                                    </View>
                                )}

                                {currentStep === 2 && (
                                    <View style={styles.stepContent}>
                                        <AppCard style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={styles.reviewAvatarContainer}>
                                                <View style={[styles.reviewAvatar, { backgroundColor: theme.surfaceAlt, borderColor: theme.primary }]}>
                                                    {values.profilePicture ? (
                                                        <Image source={{ uri: values.profilePicture }} style={styles.reviewImg} />
                                                    ) : (
                                                        <Text style={{ fontSize: 32, fontWeight: '900', color: theme.primary }}>{values.name?.[0]}</Text>
                                                    )}
                                                </View>
                                                <Text style={[styles.reviewName, { color: theme.text }]}>{values.name}</Text>
                                                <Text style={[styles.reviewPhone, { color: theme.muted }]}>{values.number}</Text>
                                            </View>

                                            <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                            <View style={styles.reviewGrid}>
                                                <ReviewItem label="JOINED" value={formatDate(values.joiningDate)} theme={theme} />
                                                <ReviewItem label="GENDER" value={values.gender} theme={theme} />
                                                <ReviewItem label="SHIFT" value={`${toDisplayTime(values.startTime)} - ${toDisplayTime(values.endTime)}`} theme={theme} />
                                                <ReviewItem label="FEES" value={values.fees ? `₹${values.fees}` : 'Free'} theme={theme} />
                                            </View>

                                            {values.seat && (
                                                <View style={[styles.reviewSeat, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }]}>
                                                    <Ionicons name="bookmark" size={16} color={theme.primary} />
                                                    <Text style={[styles.reviewSeatText, { color: theme.primary }]}>
                                                        Allocated Seat: {seats.find(s => s._id === values.seat)?.seatNumber || '—'}
                                                    </Text>
                                                </View>
                                            )}
                                        </AppCard>
                                    </View>
                                )}
                            </Animated.View>
                        </ScrollView>

                        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                            {currentStep > 0 && (
                                <TouchableOpacity onPress={handlePrev} style={[styles.backBtn, { borderColor: theme.border }]}>
                                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                                    <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={currentStep === 2 ? handleFinalSubmit : handleNext}
                                style={[styles.nextBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.nextBtnText}>{currentStep === 2 ? 'Finish & Save' : 'Continue'}</Text>
                                        <Ionicons name={currentStep === 2 ? 'checkmark-done' : 'arrow-forward'} size={20} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                <ImagePickerSheet visible={pickerSheetVisible} onClose={() => setPickerSheetVisible(false)} onSelect={handleImagePick} theme={theme} />

                {datePickerOpen && (
                    <Modal transparent visible animationType="fade">
                        <View style={styles.overlay}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => setDatePickerOpen(false)} />
                            <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                                <DateTimePicker
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    value={parseDate(values.joiningDate)}
                                    onChange={(e, d) => {
                                        if (d) setValue('joiningDate', d.toISOString().split('T')[0]);
                                        if (Platform.OS === 'android') setDatePickerOpen(false);
                                    }}
                                />
                                <AppButton onPress={() => setDatePickerOpen(false)}>Done</AppButton>
                            </View>
                        </View>
                    </Modal>
                )}

                {timePickerType && (
                    <Modal transparent visible animationType="fade">
                        <View style={styles.overlay}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => setTimePickerType(null)} />
                            <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                                <DateTimePicker
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    value={parseTime(values[timePickerType])}
                                    onChange={(e, d) => {
                                        if (d) {
                                            const h = String(d.getHours()).padStart(2, '0');
                                            const m = String(d.getMinutes()).padStart(2, '0');
                                            setValue(timePickerType, `${h}:${m}`);
                                        }
                                        if (Platform.OS === 'android') setTimePickerType(null);
                                    }}
                                />
                                <AppButton onPress={() => setTimePickerType(null)}>Done</AppButton>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal>
    );
}

function FormField({ label, name, control, errors, theme, keyboardType = 'default', placeholder, multiline }: any) {
    const hasError = Boolean(errors[name]);
    return (
        <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor={theme.muted}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        style={[
                            styles.input,
                            { 
                                borderColor: hasError ? theme.danger : theme.border,
                                backgroundColor: theme.surfaceAlt,
                                color: theme.text,
                                height: multiline ? 100 : 52,
                                paddingTop: multiline ? 12 : 0
                            }
                        ]}
                    />
                )}
            />
            {hasError && <Text style={styles.errorText}>{String(errors[name].message)}</Text>}
        </View>
    );
}

function ReviewItem({ label, value, theme }: any) {
    return (
        <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.muted }]}>{label}</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>{value || '—'}</Text>
        </View>
    );
}

const parseTime = (t?: string) => {
    const [h, m] = (t || '09:00').split(':');
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);
    return d;
};

const toDisplayTime = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = ((hour + 11) % 12) + 1;
    const hStr = String(h12).padStart(2, '0');
    return `${hStr}:${m} ${suffix}`;
};

const parseDate = (v?: string) => {
    const d = v ? new Date(v) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
};

const styles = StyleSheet.create({
    modalTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing.md,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    stepperContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        gap: 16,
    },
    stepHeaders: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stepHeaderItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '800',
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    modalScroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    stepContent: {
        gap: 24,
    },
    imagePicker: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignSelf: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        alignItems: 'center',
        gap: 4,
    },
    placeholderText: {
        fontSize: 12,
        fontWeight: '800',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formCard: {
        borderRadius: 28,
        padding: spacing.xl,
        gap: 20,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
        marginLeft: 4,
    },
    input: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '600',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdown: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 16,
    },
    errorText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ef4444',
        marginLeft: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    statusGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statusBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewCard: {
        borderRadius: 32,
        padding: spacing.xl,
        gap: 24,
    },
    reviewAvatarContainer: {
        alignItems: 'center',
        gap: 8,
    },
    reviewAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    reviewImg: {
        width: '100%',
        height: '100%',
    },
    reviewName: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    reviewPhone: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        width: '100%',
        opacity: 0.5,
    },
    reviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    reviewItem: {
        width: '45%',
        gap: 4,
    },
    reviewLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    reviewValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    reviewSeat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    reviewSeatText: {
        fontSize: 15,
        fontWeight: '800',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: 12,
    },
    backBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: '700',
    },
    nextBtn: {
        flex: 2,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerBox: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: spacing.xl,
        gap: 16,
    },
});
