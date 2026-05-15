import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Course } from '../types';
import { loadCourses, saveCourses } from '../store-timetable';
import { assignColor, TOTAL_WEEKS } from '../utils/timetable';
import { getCurrentWeek, resetSemesterToNow } from '../utils/semester';
import TimetableGrid from '../components/TimetableGrid';
import CourseModal from '../components/CourseModal';
import BatchImportModal from '../components/BatchImportModal';
import Icon from '../components/Icon';

export default function TimetableScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
  const [overflow, setOverflow] = useState(false);
  const weekScrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();

  const scrollToWeek = (w: number) => {
    const chipWidth = 30;
    const gap = 4;
    const paddingLeft = 16;
    const chipCenter = paddingLeft + (w - 1) * (chipWidth + gap) + chipWidth / 2;
    const offset = Math.max(0, chipCenter - screenWidth / 2);
    weekScrollRef.current?.scrollTo({ x: offset, animated: true });
  };

  useEffect(() => {
    loadCourses().then(setCourses);
    getCurrentWeek().then(({ week, overflow: isOverflow }) => {
      if (isOverflow) {
        setOverflow(true);
        setSelectedWeek(TOTAL_WEEKS);
        scrollToWeek(TOTAL_WEEKS);
      } else {
        setSelectedWeek(week);
        scrollToWeek(week);
      }
    });
  }, []);

  const handleReset = useCallback(() => {
    saveCourses([]);
    setCourses([]);
    resetSemesterToNow().then(() => {
      setOverflow(false);
      setSelectedWeek(1);
      scrollToWeek(1);
    });
  }, []);

  const persist = useCallback((list: Course[]) => {
    setCourses(list);
    saveCourses(list);
  }, []);

  const handleAdd = useCallback(
    (slots: Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'>[]) => {
      const baseId = Date.now().toString();
      const now = new Date().toISOString();
      const newCourses: Course[] = slots.map((data, i) => ({
        ...data,
        id: slots.length > 1 ? `${baseId}_${i}` : baseId,
        groupId: baseId,
        color: assignColor(data.name),
        createdAt: now,
      }));
      persist([...courses, ...newCourses]);
    },
    [courses, persist]
  );

  const handleEdit = useCallback(
    (slots: Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'>[]) => {
      if (!editingCourse) return;
      const groupId = editingCourse.groupId;
      const now = new Date().toISOString();
      const newCourses: Course[] = slots.map((data, i) => ({
        ...data,
        id: slots.length > 1 ? `${groupId}_${i}` : groupId,
        groupId,
        color: editingCourse.color,
        createdAt: now,
      }));
      const filtered = courses.filter((c) => c.groupId !== groupId);
      persist([...filtered, ...newCourses]);
      setEditingCourse(undefined);
    },
    [editingCourse, courses, persist]
  );

  const handleDelete = useCallback(
    (ids: string[]) => {
      persist(courses.filter((c) => !ids.includes(c.id)));
    },
    [courses, persist]
  );

  const handleBatchImport = useCallback(
    (newCourses: (Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'> & { groupId?: string })[]) => {
      const now = new Date().toISOString();
      const full: Course[] = newCourses.map((c, i) => ({
        ...c,
        id: (Date.now() + i).toString(),
        groupId: c.groupId || (Date.now() + i).toString(),
        color: assignColor(c.name),
        createdAt: now,
      }));
      persist([...courses, ...full]);
    },
    [courses, persist]
  );

  const handleCoursePress = useCallback((course: Course) => {
    setEditingCourse(course);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>课程表</Text>
        <View style={styles.headerActions}>
          {overflow && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
            >
              <Text style={styles.resetBtnText}>重置课表</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.batchBtn}
            onPress={() => setShowBatch(true)}
          >
            <Text style={styles.batchBtnText}>批量导入</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Week selector */}
      <View style={styles.weekBar}>
        <ScrollView
          ref={weekScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekContent}
        >
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
            <TouchableOpacity
              key={w}
              style={[
                styles.weekChip,
                selectedWeek === w && styles.weekChipActive,
              ]}
              onPress={() => setSelectedWeek(w)}
            >
              <Text
                style={[
                  styles.weekChipText,
                  selectedWeek === w && styles.weekChipTextActive,
                ]}
              >
                {w}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TimetableGrid
        courses={courses}
        selectedWeek={selectedWeek}
        onCoursePress={handleCoursePress}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowAdd(true)}
      >
        <Icon name="plus" size={22} color="#fff" />
      </TouchableOpacity>

      <CourseModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
        existingCourses={courses}
      />

      <CourseModal
        visible={editingCourse !== undefined}
        onClose={() => setEditingCourse(undefined)}
        onSubmit={handleEdit}
        onDelete={handleDelete}
        initialCourse={editingCourse}
        siblingCourses={
          editingCourse
            ? courses.filter((c) => c.groupId === editingCourse.groupId && c.id !== editingCourse.id)
            : undefined
        }
        existingCourses={courses}
      />

      <BatchImportModal
        visible={showBatch}
        onClose={() => setShowBatch(false)}
        onImport={handleBatchImport}
        existingCourses={courses}
      />
    </View>
  );
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  batchBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  batchBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  weekBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD1BA',
    paddingVertical: 4,
  },
  weekContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  weekChip: {
    width: 30,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekChipActive: {
    backgroundColor: '#FF6B35',
  },
  weekChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#636E72',
  },
  weekChipTextActive: {
    color: '#fff',
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
