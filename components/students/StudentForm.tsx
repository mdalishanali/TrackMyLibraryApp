import { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { AppButton } from '@/components/ui/app-button';
import { spacing, radius } from '@/constants/design';

export function StudentForm({ visible, onClose, theme, seats, form, title }) {
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerType, setTimePickerType] = useState(null);

    const seatData = [
        { label: 'Unallocated', value: '' },
        ...seats.map(s => ({
            label: `Floor ${s.floor} · Seat ${s.seatNumber}`,
            value: s._id
        }))
    ];

    function handleTime(value) {
        if (!value) {
            setTimePickerType(null);
            return;
        }
        const h = String(value.getHours()).padStart(2, '0');
        const m = String(value.getMinutes()).padStart(2, '0');
        const v = `${h}:${m}`;
        if (timePickerType === 'start') form.setValue('startTime', v);
        if (timePickerType === 'end') form.setValue('endTime', v);
        setTimePickerType(null);
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={{ padding: spacing.lg }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

                        <FormField label="Name" name="name" form={form} theme={theme} />
                        <FormField label="Phone" name="number" form={form} theme={theme} keyboardType="phone-pad" />

                        <DateSelector
                            label="Joining Date"
                            value={form.watch('joiningDate')}
                            theme={theme}
                            onPress={() => setDatePickerOpen(true)}
                        />

                        <TimeSelector
                            label="Start Time"
                            value={form.watch('startTime')}
                            theme={theme}
                            onPress={() => setTimePickerType('start')}
                        />

                        <TimeSelector
                            label="End Time"
                            value={form.watch('endTime')}
                            theme={theme}
                            onPress={() => setTimePickerType('end')}
                        />

                        <FormField label="Fees" name="fees" form={form} theme={theme} keyboardType="numeric" />
                        <FormField label="Notes" name="notes" form={form} theme={theme} />

                        <Text style={[styles.label, { color: theme.text }]}>Seat</Text>

                        <Dropdown
                            style={[styles.dropdown, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                            placeholderStyle={{ color: theme.muted }}
                            selectedTextStyle={{ color: theme.text }}
                            itemTextStyle={{ color: theme.text }}
                            containerStyle={{ backgroundColor: theme.surface }}
                            activeColor={theme.primarySoft}
                            search
                            searchPlaceholder="Search seat"
                            data={seatData}
                            labelField="label"
                            valueField="value"
                            value={form.watch('seat') || ''}
                            onChange={item => form.setValue('seat', item.value || undefined)}
                            placeholder="Select seat"
                        />

                        <View style={styles.actions}>
                            <AppButton variant="outline" onPress={onClose}>Cancel</AppButton>
                            <AppButton onPress={form.submit}>Save</AppButton>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <Modal transparent visible={datePickerOpen}>
                    <View style={styles.overlay}>
                        <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                            <DateTimePicker
                                mode="date"
                                display="spinner"
                                value={new Date(form.watch('joiningDate') || Date.now())}
                                onChange={(e, d) => {
                                    if (d) {
                                        const v = d.toISOString().split('T')[0];
                                        form.setValue('joiningDate', v);
                                    }
                                    setDatePickerOpen(false);
                                }}
                            />
                            <AppButton variant="outline" onPress={() => setDatePickerOpen(false)}>Done</AppButton>
                        </View>
                    </View>
                </Modal>

                <Modal transparent visible={!!timePickerType}>
                    <View style={styles.overlay}>
                        <View style={[styles.pickerBox, { backgroundColor: theme.surface }]}>
                            <DateTimePicker
                                mode="time"
                                display="spinner"
                                value={parseTime(
                                    form.watch(timePickerType === 'start' ? 'startTime' : 'endTime')
                                )}
                                onChange={(e, d) => handleTime(d)}
                            />
                            <AppButton variant="outline" onPress={() => setTimePickerType(null)}>Done</AppButton>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </Modal>
    );
}

function FormField({ label, name, form, theme, keyboardType = 'default' }) {
    return (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <TextInput
                value={String(form.watch(name) || '')}
                onChangeText={t => form.setValue(name, t)}
                placeholder={label}
                placeholderTextColor={theme.muted}
                keyboardType={keyboardType}
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
            />
        </View>
    );
}

function DateSelector({ label, value, theme, onPress }) {
    return (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <TouchableOpacity onPress={onPress} style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={{ color: theme.text }}>{value || 'Select date'}</Text>
            </TouchableOpacity>
        </View>
    );
}

function TimeSelector({ label, value, theme, onPress }) {
    return (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <TouchableOpacity onPress={onPress} style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={{ color: theme.text }}>{value || 'Select time'}</Text>
            </TouchableOpacity>
        </View>
    );
}

function parseTime(t) {
    const [h, m] = (t || '09:00').split(':');
    const d = new Date();
    d.setHours(Number(h));
    d.setMinutes(Number(m));
    d.setSeconds(0);
    return d;
}

const styles = StyleSheet.create({
    title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.md },
    label: { marginBottom: spacing.xs, fontSize: 14 },
    input: {
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 48,
        marginBottom: spacing.md
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
        marginTop: spacing.lg
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    pickerBox: {
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center'
    }
});
