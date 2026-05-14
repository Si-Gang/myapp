import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Course } from '../types';
import {
  PERIODS,
  VALID_STARTS,
  TOTAL_WEEKS,
  isValidStart,
  getOverlappingCourse,
} from '../utils/timetable';

type CourseInput = Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (courses: CourseInput[]) => void;
  onDelete?: (ids: string[]) => void;
  initialCourse?: Course;
  siblingCourses?: Course[];
  existingCourses: Course[];
}

const DAYS = ['一', '二', '三', '四', '五'];

export default function CourseModal({
  visible,
  onClose,
  onSubmit,
  onDelete,
  initialCourse,
  siblingCourses,
  existingCourses,
}: Props) {
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [classroom, setClassroom] = useState('');

  // Slot 1
  const [day1, setDay1] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [dur1, setDur1] = useState<2 | 3>(2);
  const [start1, setStart1] = useState<number>(VALID_STARTS[2][0]);

  // Slot 2
  const [slot2, setSlot2] = useState(false);
  const [day2, setDay2] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [dur2, setDur2] = useState<2 | 3>(2);
  const [start2, setStart2] = useState<number>(VALID_STARTS[2][0]);

  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(16);
  const [error, setError] = useState('');

  const starts1 = VALID_STARTS[dur1];
  const starts2 = VALID_STARTS[dur2];

  const handleOpen = () => {
    if (initialCourse) {
      setName(initialCourse.name);
      setTeacher(initialCourse.teacher);
      setClassroom(initialCourse.classroom);
      setDay1(initialCourse.dayOfWeek);
      setDur1(initialCourse.duration);
      setStart1(initialCourse.startPeriod);
      setStartWeek(initialCourse.startWeek ?? 1);
      setEndWeek(initialCourse.endWeek ?? 16);

      if (siblingCourses && siblingCourses.length > 0) {
        const sib = siblingCourses[0];
        setSlot2(true);
        setDay2(sib.dayOfWeek);
        setDur2(sib.duration);
        setStart2(sib.startPeriod);
      } else {
        setSlot2(false);
        setDay2(1);
        setDur2(2);
        setStart2(VALID_STARTS[2][0]);
      }
    } else {
      setName('');
      setTeacher('');
      setClassroom('');
      setDay1(1);
      setDur1(2);
      setStart1(VALID_STARTS[2][0]);
      setSlot2(false);
      setDay2(1);
      setDur2(2);
      setStart2(VALID_STARTS[2][0]);
      setStartWeek(1);
      setEndWeek(16);
    }
    setError('');
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入课程名称');
      return;
    }

    const slots: CourseInput[] = [];

    // Validate slot 1
    const overlap1 = getOverlappingCourse(
      day1, start1, dur1, startWeek, endWeek,
      existingCourses,
      initialCourse?.id ? [initialCourse.id] : undefined
    );
    if (overlap1) {
      setError(`时段1冲突：与「${overlap1.name}」重叠`);
      return;
    }
    slots.push({
      name: trimmed, teacher: teacher.trim(), classroom: classroom.trim(),
      dayOfWeek: day1, startPeriod: start1, duration: dur1,
      startWeek, endWeek,
    });

    // Validate slot 2
    if (slot2) {
      const excludeIds: string[] = [];
      if (initialCourse) excludeIds.push(initialCourse.id);
      if (siblingCourses?.[0]?.id) excludeIds.push(siblingCourses[0].id);

      const overlap2 = getOverlappingCourse(
        day2, start2, dur2, startWeek, endWeek,
        existingCourses,
        excludeIds.length > 0 ? excludeIds : undefined
      );
      if (overlap2) {
        setError(`时段2冲突：与「${overlap2.name}」重叠`);
        return;
      }

      // Check slot2 doesn't conflict with slot1 on the same day
      if (day1 === day2) {
        const range1: number[] = [];
        for (let i = 0; i < dur1; i++) range1.push(start1 + i);
        const range2: number[] = [];
        for (let i = 0; i < dur2; i++) range2.push(start2 + i);
        if (range1.some((p) => range2.includes(p))) {
          setError('两个时段不能在同一天同一节次');
          return;
        }
      }

      slots.push({
        name: trimmed, teacher: teacher.trim(), classroom: classroom.trim(),
        dayOfWeek: day2, startPeriod: start2, duration: dur2,
        startWeek, endWeek,
      });
    }

    onSubmit(slots);

    setName(''); setTeacher(''); setClassroom('');
    setDay1(1); setDur1(2); setStart1(VALID_STARTS[2][0]);
    setSlot2(false); setDay2(1); setDur2(2); setStart2(VALID_STARTS[2][0]);
    setStartWeek(1); setEndWeek(16);
    setError('');
    onClose();
  };

  const getStartLabel = (p: number) => {
    const period = PERIODS.find((x) => x.period === p);
    if (!period) return `第${p}节`;
    return `第${p}节 ${period.start}-${period.end}`;
  };

  const renderSlot = (
    label: string,
    day: number, setDay: (d: 1|2|3|4|5) => void,
    dur: number, setDur: (d: 2|3) => void,
    start: number, setStart: (p: number) => void,
    starts: number[],
  ) => (
    <View style={styles.slotBox}>
      <Text style={styles.slotLabel}>{label}</Text>

      <View style={styles.dayRow}>
        {DAYS.map((d, i) => {
          const dayVal = (i + 1) as 1 | 2 | 3 | 4 | 5;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, day === dayVal && styles.dayBtnActive]}
              onPress={() => setDay(dayVal)}
            >
              <Text style={[styles.dayText, day === dayVal && styles.dayTextActive]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, dur === 2 && styles.toggleBtnActive]}
          onPress={() => { setDur(2); if (!isValidStart(start, 2)) setStart(VALID_STARTS[2][0]); }}
        >
          <Text style={[styles.toggleText, dur === 2 && styles.toggleTextActive]}>2节</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, dur === 3 && styles.toggleBtnActive]}
          onPress={() => { setDur(3); if (!isValidStart(start, 3)) setStart(VALID_STARTS[3][0]); }}
        >
          <Text style={[styles.toggleText, dur === 3 && styles.toggleTextActive]}>3节</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.startRow}>
        {starts.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.startBtn, start === p && styles.startBtnActive]}
            onPress={() => setStart(p)}
          >
            <Text style={[styles.startText, start === p && styles.startTextActive]}>
              {getStartLabel(p)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={handleOpen}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {initialCourse ? '编辑课程' : '添加课程'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="课程名称"
              placeholderTextColor="#B2BEC3"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="教师"
                placeholderTextColor="#B2BEC3"
                value={teacher}
                onChangeText={setTeacher}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="教室"
                placeholderTextColor="#B2BEC3"
                value={classroom}
                onChangeText={setClassroom}
              />
            </View>

            {renderSlot('时段 1', day1, setDay1, dur1, setDur1, start1, setStart1, starts1)}

            {slot2 ? (
              <>
                {renderSlot('时段 2', day2, setDay2, dur2, setDur2, start2, setStart2, starts2)}
                <TouchableOpacity
                  style={styles.removeSlotBtn}
                  onPress={() => setSlot2(false)}
                >
                  <Text style={styles.removeSlotText}>− 移除时段2</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.addSlotBtn}
                onPress={() => setSlot2(true)}
              >
                <Text style={styles.addSlotText}>+ 添加第二时段</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>起始周</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll} contentContainerStyle={styles.weekScrollContent}>
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                <TouchableOpacity
                  key={`s${w}`}
                  style={[styles.weekBtn, startWeek === w && styles.weekBtnActive, w > endWeek && styles.weekBtnDisabled]}
                  onPress={() => setStartWeek(w)}
                >
                  <Text style={[styles.weekText, startWeek === w && styles.weekTextActive, w > endWeek && styles.weekTextDisabled]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>结束周</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll} contentContainerStyle={styles.weekScrollContent}>
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                <TouchableOpacity
                  key={`e${w}`}
                  style={[styles.weekBtn, endWeek === w && styles.weekBtnActive, w < startWeek && styles.weekBtnDisabled]}
                  onPress={() => setEndWeek(w)}
                >
                  <Text style={[styles.weekText, endWeek === w && styles.weekTextActive, w < startWeek && styles.weekTextDisabled]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.btnRow}>
            {initialCourse && onDelete ? (
              <TouchableOpacity
                style={[styles.btn, styles.deleteBtn]}
                onPress={() => {
                  const ids = [initialCourse.id];
                  if (siblingCourses) {
                    siblingCourses.forEach((s) => ids.push(s.id));
                  }
                  onDelete(ids);
                  onClose();
                }}
              >
                <Text style={styles.deleteText}>删除</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handleSubmit}>
              <Text style={styles.confirmText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  scrollArea: {
    maxHeight: 430,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D3436',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#636E72',
    marginBottom: 4,
    marginTop: 4,
  },
  slotBox: {
    backgroundColor: '#FFF8F5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FFD1BA',
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 6,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  dayBtnActive: {
    backgroundColor: '#FF6B35',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#636E72',
  },
  dayTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FF6B35',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
  },
  toggleTextActive: {
    color: '#fff',
  },
  startRow: {
    gap: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  startBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  startBtnActive: {
    backgroundColor: '#FF6B35',
  },
  startText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636E72',
  },
  startTextActive: {
    color: '#fff',
  },
  addSlotBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD1BA',
    borderRadius: 10,
    borderStyle: 'dashed',
    marginBottom: 6,
  },
  addSlotText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  removeSlotBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  removeSlotText: {
    fontSize: 13,
    color: '#FF4757',
    fontWeight: '500',
  },
  error: {
    fontSize: 13,
    color: '#FF4757',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8E8',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0F0F0',
  },
  cancelText: {
    fontSize: 15,
    color: '#636E72',
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#FF6B35',
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#FF4757',
  },
  deleteText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  weekScroll: {
    marginBottom: 6,
  },
  weekScrollContent: {
    gap: 4,
    paddingRight: 8,
  },
  weekBtn: {
    width: 30,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBtnActive: {
    backgroundColor: '#FF6B35',
  },
  weekBtnDisabled: {
    backgroundColor: '#F8F8F8',
    opacity: 0.4,
  },
  weekText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#636E72',
  },
  weekTextActive: {
    color: '#fff',
  },
  weekTextDisabled: {
    color: '#CCC',
  },
});
