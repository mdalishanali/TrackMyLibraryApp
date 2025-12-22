import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudentCard from './StudentCard';
import StudentSkeletonList from './StudentSkeletonList';
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
    loadingMore,
    isLoading,
    headerComponent,
}: {
    students: any[];
    theme: any;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onPay: (student: any) => void;
    onLoadMore: () => void;
    refreshing: boolean;
    onRefresh: () => void;
    loadingMore: boolean;
        isLoading?: boolean;
    headerComponent?: React.ReactElement | null;
}) {
    const insets = useSafeAreaInsets();
    return (
        <FlatList
            data={students}
            keyExtractor={(item) => (item._id?.toString() || item.id?.toString() || Math.random().toString())}
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
            style={{ backgroundColor: theme.background }}
            contentContainerStyle={{
                gap: spacing.md,
                padding: 10,
                paddingBottom: spacing.lg + insets.bottom,
                backgroundColor: theme.background,
            }}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.4}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListHeaderComponent={headerComponent ? <View style={{ marginBottom: spacing.md }}>{headerComponent}</View> : null}
            ListFooterComponent={
                loadingMore ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                        <ActivityIndicator color={theme.primary} />
                        <Text style={{ color: theme.muted, marginTop: spacing.xs }}>Loading more...</Text>
                    </View>
                ) : null
            }
            ListEmptyComponent={
                isLoading ? (
                    <StudentSkeletonList />
                ) : (
                        <View style={{ paddingTop: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
                            <Text style={{ color: theme.muted, fontWeight: '600' }}>No students found</Text>
                            <Text style={{ color: theme.muted }}>Try adjusting search or filters.</Text>
                        </View>
                    )
            }
        />
    );
}
