import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Schedule } from '../types';
import Icon from './Icon';

interface Props {
  item: Schedule;
  onDelete: (id: string) => void;
  onEdit: (item: Schedule) => void;
  onToggleComplete: (id: string) => void;
}

function getRemaining(deadline: string, completed: boolean): { text: string; overdue: boolean } {
  if (completed) return { text: '已完成', overdue: false };

  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diff = dl - now;

  if (diff < 0) {
    const abs = Math.abs(diff);
    const days = Math.floor(abs / 86400000);
    const hours = Math.floor((abs % 86400000) / 3600000);
    if (days > 0) return { text: `已过期 ${days} 天`, overdue: true };
    if (hours > 0) return { text: `已过期 ${hours} 小时`, overdue: true };
    return { text: '已过期', overdue: true };
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return { text: `剩余 ${days} 天 ${hours} 小时`, overdue: false };
  if (hours > 0) return { text: `剩余 ${hours} 小时 ${mins} 分钟`, overdue: false };
  if (mins > 0) return { text: `剩余 ${mins} 分钟`, overdue: false };
  return { text: '即将到期', overdue: true };
}

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${min}`;
}

export default function ScheduleItem({ item, onDelete, onEdit, onToggleComplete }: Props) {
  const swipeableRef = useRef<Swipeable>(null);
  const [expanded, setExpanded] = useState(false);
  const { text: remaining, overdue } = getRemaining(item.deadline, item.completed);
  const showOverdue = overdue && !item.completed;

  const closeSwipe = () => {
    swipeableRef.current?.close();
  };

  const handleDelete = () => {
    closeSwipe();
    onDelete(item.id);
  };

  const handleEdit = () => {
    closeSwipe();
    onEdit(item);
  };

  const handleToggle = () => {
    onToggleComplete(item.id);
  };

  const handleToggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.action, styles.deleteAction]}
      onPress={handleDelete}
    >
      <Icon name="delete" size={18} color="#fff" />
      <Text style={styles.actionText}>删除</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = () => (
    <TouchableOpacity
      style={[styles.action, styles.editAction]}
      onPress={handleEdit}
    >
      <Icon name="edit" size={18} color="#fff" />
      <Text style={styles.actionText}>编辑</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <View
        style={[
          styles.container,
          showOverdue && styles.overdue,
          item.completed && styles.completed,
          showOverdue && styles.overdueBorder,
          !showOverdue && !item.completed && styles.normalBorder,
        ]}
      >
        <View style={styles.row}>
          {/* Completion circle */}
          <TouchableOpacity
            style={[styles.checkCircle, item.completed && styles.checkCircleDone]}
            onPress={handleToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {item.completed && <Text style={styles.checkMark}>{'✓'}</Text>}
          </TouchableOpacity>

          {/* Main content - tap to expand */}
          <TouchableOpacity
            style={styles.content}
            onPress={handleToggleExpand}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.title, item.completed && styles.titleDone]}
              numberOfLines={expanded ? undefined : 1}
            >
              {item.title}
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.deadline, item.completed && styles.textDone]}>
                {formatDeadline(item.deadline)}
              </Text>
              <Text
                style={[
                  styles.remaining,
                  item.completed && styles.remainingDone,
                  showOverdue && styles.remainingOverdue,
                ]}
              >
                {remaining}
              </Text>
            </View>

            {/* Expand indicator */}
            {item.description ? (
              <View style={styles.expandHint}>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={10} color="#FF6B35" />
                <Text style={styles.expandLabel}>
                  {expanded ? '收起' : '查看描述'}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Description area - shown when expanded */}
        {expanded && item.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        ) : null}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  normalBorder: {
    borderLeftColor: '#FF6B35',
  },
  overdueBorder: {
    borderLeftColor: '#FF4757',
  },
  overdue: {
    backgroundColor: '#FFF5F5',
  },
  completed: {
    opacity: 0.7,
    borderLeftColor: '#2ED573',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingRight: 14,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginLeft: 12,
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#2ED573',
    borderColor: '#2ED573',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 6,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: '#B2BEC3',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadline: {
    fontSize: 13,
    color: '#636E72',
  },
  textDone: {
    color: '#B2BEC3',
  },
  remaining: {
    fontSize: 13,
    color: '#2ED573',
    fontWeight: '600',
  },
  remainingDone: {
    color: '#2ED573',
  },
  remainingOverdue: {
    color: '#FF4757',
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  expandLabel: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
  },
  descBox: {
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#FFD1BA',
  },
  descText: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 21,
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 12,
    marginVertical: 5,
  },
  deleteAction: {
    backgroundColor: '#FF4757',
    marginRight: 14,
  },
  editAction: {
    backgroundColor: '#6C63FF',
    marginLeft: 14,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
