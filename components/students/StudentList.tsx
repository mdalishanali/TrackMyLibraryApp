import { FlatList, Text } from 'react-native';
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
                loadingMore ? <Text style={{ color: theme.muted }}>Loading more...</Text> : null
            }
            ListEmptyComponent={
                <Text style={{ color: theme.muted }}>No students found</Text>
            }
        />
    );
}
