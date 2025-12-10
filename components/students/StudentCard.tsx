import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { AppButton } from '@/components/ui/app-button';
import { AppBadge } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { spacing, radius, typography } from '@/constants/design';
import { formatDate, formatCurrency } from '@/utils/format';

export default function StudentCard({ student, theme, onView, onEdit, onDelete, onPay }) {
    return (
        <AppCard style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.header}>
                <View style={styles.row}>
                    <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]}>
                        {student.profilePicture ? (
                            <Image source={{ uri: student.profilePicture }} style={styles.avatarImg} />
                        ) : (
                            <Text style={[styles.avatarText, { color: theme.text }]}>
                                {student.name[0]?.toUpperCase()}
                            </Text>
                        )}
                    </View>

                    <View>
                        <Text style={[styles.name, { color: theme.text }]}>{student.name}</Text>
                        <Text style={[styles.meta, { color: theme.muted }]}>ID: {student.id}</Text>
                    </View>
                </View>

                <AppBadge tone={student.status === 'Active' ? 'success' : 'warning'}>
                    {student.status}
                </AppBadge>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                    <Text style={[styles.label]}>Phone</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{student.number}</Text>
                </View>

                <View style={styles.infoCol}>
                    <Text style={[styles.label]}>Shift</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{student.shift}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                    <Text style={[styles.label]}>Joined</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{formatDate(student.joiningDate)}</Text>
                </View>

                <View style={styles.infoCol}>
                    <Text style={[styles.label]}>Seat</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{student.seatNumber ?? 'Unallocated'}</Text>
                </View>
            </View>

            <View style={[styles.paymentBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.paymentTitle, { color: theme.text }]}>Payment Info</Text>

                <Text style={[styles.paymentText, { color: theme.muted }]}>
                    Last Payment: {student.lastPayment?.paymentDate ? formatDate(student.lastPayment.paymentDate) : 'No payment'}
                </Text>

                <Text style={[styles.paymentText, { color: theme.muted }]}>
                    Period:{' '}
                    {student.lastPayment?.startDate
                        ? `${formatDate(student.lastPayment.startDate)} - ${formatDate(student.lastPayment.endDate)}`
                        : '—'}
                </Text>

                {student.lastPayment?.rupees && (
                    <Text style={[styles.amount, { color: theme.text }]}>
                        {formatCurrency(student.lastPayment.rupees)}
                    </Text>
                )}
            </View>

            <View style={styles.actions}>
                <AppButton variant="outline" onPress={() => onView(student._id)}>View</AppButton>
                <AppButton variant="outline" onPress={() => onEdit(student._id)}>Edit</AppButton>
                <AppButton variant="outline" onPress={() => onDelete(student._id)}>Delete</AppButton>
                <AppButton onPress={() => onPay(student)}>Pay</AppButton>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: spacing.md,
        borderRadius: radius.xl,
        gap: spacing.md,
        marginBottom: spacing.md
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center'
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 23 },
    avatarText: { fontSize: 18, fontWeight: '700' },
    name: { fontSize: 16, fontWeight: '700' },
    meta: { fontSize: 12 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    infoCol: {
        width: '48%',
    },
    label: {
        fontSize: 12,
        opacity: 0.6
    },
    value: {
        fontSize: 14,
        fontWeight: '500'
    },
    paymentBox: {
        padding: spacing.sm,
        borderRadius: radius.md,
        gap: 3
    },
    paymentTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: spacing.xs
    },
    paymentText: {
        fontSize: 13
    },
    amount: {
        marginTop: 4,
        fontSize: 15,
        fontWeight: '700'
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap'
    }
});
