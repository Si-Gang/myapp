import { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Schedule } from '../types';
import { loadSchedules, saveSchedules } from '../store';
import { scheduleDeadlineReminders } from '../notifications';
import ScheduleList from '../components/ScheduleList';
import AddModal from '../components/AddModal';
import Icon from '../components/Icon';

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<Schedule | null>(null);
  const [showCleanup, setShowCleanup] = useState(false);

  useEffect(() => {
    loadSchedules().then((data) => {
      setSchedules(sortSchedules(data));
    });
  }, []);

  const persist = useCallback((list: Schedule[]) => {
    const sorted = sortSchedules(list);
    setSchedules(sorted);
    saveSchedules(sorted);
    scheduleDeadlineReminders(sorted);
  }, []);

  const handleAdd = useCallback(
    (title: string, deadline: Date, description: string) => {
      const item: Schedule = {
        id: Date.now().toString(),
        title,
        description,
        deadline: deadline.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      persist([item, ...schedules]);
    },
    [schedules, persist]
  );

  const handleEdit = useCallback(
    (title: string, deadline: Date, description: string) => {
      if (!editingItem) return;
      const updated = schedules.map((s) =>
        s.id === editingItem.id
          ? { ...s, title, description, deadline: deadline.toISOString() }
          : s
      );
      persist(updated);
      setEditingItem(null);
    },
    [editingItem, schedules, persist]
  );

  const handleDelete = useCallback(
    (id: string) => {
      persist(schedules.filter((s) => s.id !== id));
    },
    [schedules, persist]
  );

  const handleToggleComplete = useCallback(
    (id: string) => {
      const updated = schedules.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s
      );
      persist(updated);
    },
    [schedules, persist]
  );

  const cleanupTargets = schedules.filter(
    (s) => s.completed || new Date(s.deadline) < new Date()
  );

  const handleCleanup = useCallback(() => {
    setShowCleanup(true);
  }, []);

  const handleConfirmCleanup = useCallback(() => {
    const now = new Date();
    persist(
      schedules.filter((s) => !s.completed && new Date(s.deadline) >= now)
    );
    setShowCleanup(false);
  }, [schedules, persist]);

  const openEdit = useCallback((item: Schedule) => {
    setEditingItem(item);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>日程安排</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerCount}>
            {schedules.length > 0 ? `${schedules.length} 个日程` : ''}
          </Text>
          {cleanupTargets.length > 0 && (
            <TouchableOpacity style={styles.cleanupBtn} onPress={handleCleanup}>
              <Text style={styles.cleanupText}>清理已完成/过期</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScheduleList
        schedules={schedules}
        onDelete={handleDelete}
        onEdit={openEdit}
        onToggleComplete={handleToggleComplete}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowAdd(true)}
      >
        <Icon name="plus" size={22} color="#fff" />
      </TouchableOpacity>

      <AddModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
      />

      <AddModal
        visible={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSubmit={handleEdit}
        initialTitle={editingItem?.title ?? ''}
        initialDescription={editingItem?.description ?? ''}
        initialDeadline={
          editingItem ? new Date(editingItem.deadline) : undefined
        }
      />

      <Modal visible={showCleanup} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>清理日程</Text>
            <Text style={styles.confirmMessage}>
              确定 {cleanupTargets.length} 个已完成或过期的日程吗？此操作不可撤销。
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancelBtn]}
                onPress={() => setShowCleanup(false)}
              >
                <Text style={styles.confirmCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDeleteBtn]}
                onPress={handleConfirmCleanup}
              >
                <Text style={styles.confirmDeleteText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function sortSchedules(list: Schedule[]): Schedule[] {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? -1 : 1;
    }
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FF6B35',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  headerCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  cleanupBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  cleanupText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmDialog: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtn: {
    backgroundColor: '#F0F0F0',
  },
  confirmCancelText: {
    fontSize: 15,
    color: '#636E72',
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    backgroundColor: '#FF4757',
  },
  confirmDeleteText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },

});
