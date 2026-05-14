import { FlatList, StyleSheet, View } from 'react-native';
import { Schedule } from '../types';
import ScheduleItem from './ScheduleItem';
import EmptyState from './EmptyState';

interface Props {
  schedules: Schedule[];
  onDelete: (id: string) => void;
  onEdit: (item: Schedule) => void;
  onToggleComplete: (id: string) => void;
}

export default function ScheduleList({ schedules, onDelete, onEdit, onToggleComplete }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScheduleItem
            item={item}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggleComplete={onToggleComplete}
          />
        )}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={schedules.length === 0 && styles.emptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
});
