import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import StudentCard from './StudentCard';
import { spacing } from '@/constants/design';

export default function StudentList({
    students,
    theme,
    onView,
    onEdit,
    onDelete,
    onPay,
    onLoadMore,
    refreshing,
    onRefresh,
    loadingMore
}) {
    return (
        <FlatList
            data={students}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
                <StudentCard
                    student={item}
                    theme={theme}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPay={onPay}
                />
            )}
            contentContainerStyle={{ gap: spacing.md, padding:10 }}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.4}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListFooterComponent={
                loadingMore ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                        <ActivityIndicator color={theme.primary} />
                        <Text style={{ color: theme.muted, marginTop: spacing.xs }}>Loading more...</Text>
                    </View>
                ) : null
            }
            ListEmptyComponent={
                <View style={{ paddingTop: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
                    <Text style={{ color: theme.muted, fontWeight: '600' }}>No students found</Text>
                    <Text style={{ color: theme.muted }}>Try adjusting search or filters.</Text>
                </View>
            }
        />
    );
}
