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
  TOTAL_WEEKS,
  isValidStart,
  hasOverlap,
} from '../utils/timetable';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImport: (courses: (Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'> & { groupId?: string })[]) => void;
  existingCourses: Course[];
}

interface CourseInput {
  course: Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'>;
  valid: boolean;
  error?: string;
}

interface ValidatedLine {
  slots: CourseInput[];
  lineIndex: number;
}

// Format: name,teacher,classroom,day,start,dur,startWeek,endWeek[,day2,start2,dur2]
const PLACEHOLDER = `高等数学,王老师,A201,1,1,2,1,16
大学英语,李老师,B105,1,1,2,3,3,2,4,16
大学物理,张老师,实验楼,4,8,3,1,8`;

function validateSlot(
  name: string,
  teacher: string,
  classroom: string,
  dayOfWeek: number,
  startPeriod: number,
  duration: number,
  startWeek: number,
  endWeek: number,
  existingCourses: Course[],
): string[] {
  const errors: string[] = [];
  if (!name) errors.push('缺少课程名称');
  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 5) errors.push('星期必须为 1-5');
  if (isNaN(startPeriod) || startPeriod < 1 || startPeriod > 13) errors.push('起始节必须为 1-13');
  if (duration !== 2 && duration !== 3) errors.push('持续节必须为 2 或 3');
  if (isNaN(startWeek) || startWeek < 1 || startWeek > TOTAL_WEEKS) errors.push(`起始周必须为 1-${TOTAL_WEEKS}`);
  if (isNaN(endWeek) || endWeek < 1 || endWeek > TOTAL_WEEKS) errors.push(`结束周必须为 1-${TOTAL_WEEKS}`);
  if (startWeek && endWeek && startWeek > endWeek) errors.push('起始周不能大于结束周');

  if (errors.length === 0) {
    if (!isValidStart(startPeriod, duration as 2 | 3)) {
      errors.push(`持续${duration}节不能从第${startPeriod}节开始`);
    }
    if (
      hasOverlap(dayOfWeek, startPeriod, duration, startWeek, endWeek, existingCourses)
    ) {
      errors.push('与已有课程冲突');
    }
  }
  return errors;
}

function parseLine(line: string, index: number, existingCourses: Course[]): ValidatedLine {
  const trimmed = line.trim();
  if (!trimmed) {
    return { slots: [], lineIndex: index };
  }

  const parts = trimmed.split(',').map((s) => s.trim());
  if (parts.length < 8) {
    return {
      slots: [{
        course: {} as any,
        valid: false,
        error: `字段不足（至少8个，实际${parts.length}个）`,
      }],
      lineIndex: index,
    };
  }

  const name = parts[0];
  const teacher = parts[1];
  const classroom = parts[2];

  // First time slot (fields 3-5)
  const slot1 = {
    dayOfWeek: parseInt(parts[3], 10),
    startPeriod: parseInt(parts[4], 10),
    duration: parseInt(parts[5], 10),
  };

  const hasSlot2 = parts.length >= 11;
  let slot2 = null;
  let startWeek: number;
  let endWeek: number;

  if (hasSlot2) {
    // Fields 6-8 = second time slot, 9-10 = weeks
    slot2 = {
      dayOfWeek: parseInt(parts[6], 10),
      startPeriod: parseInt(parts[7], 10),
      duration: parseInt(parts[8], 10),
    };
    startWeek = parseInt(parts[9], 10);
    endWeek = parseInt(parts[10], 10);
  } else {
    // Fields 6-7 = weeks
    startWeek = parseInt(parts[6], 10);
    endWeek = parseInt(parts[7], 10);
  }

  const baseCourse = { name, teacher, classroom, startWeek, endWeek };
  const errors1 = validateSlot(
    name, teacher, classroom,
    slot1.dayOfWeek, slot1.startPeriod, slot1.duration,
    startWeek, endWeek, existingCourses,
  );

  const slots: CourseInput[] = [{
    course: {
      ...baseCourse,
      dayOfWeek: slot1.dayOfWeek as 1 | 2 | 3 | 4 | 5,
      startPeriod: slot1.startPeriod,
      duration: slot1.duration as 2 | 3,
    },
    valid: errors1.length === 0,
    error: errors1.length > 0 ? errors1.join('；') : undefined,
  }];

  if (hasSlot2 && slot2) {
    const errors2 = validateSlot(
      name, teacher, classroom,
      slot2.dayOfWeek, slot2.startPeriod, slot2.duration,
      startWeek, endWeek, existingCourses,
    );
    slots.push({
      course: {
        ...baseCourse,
        dayOfWeek: slot2.dayOfWeek as 1 | 2 | 3 | 4 | 5,
        startPeriod: slot2.startPeriod,
        duration: slot2.duration as 2 | 3,
      },
      valid: errors2.length === 0,
      error: errors2.length > 0 ? errors2.join('；') : undefined,
    });
  }

  return { slots, lineIndex: index };
}

export default function BatchImportModal({
  visible,
  onClose,
  onImport,
  existingCourses,
}: Props) {
  const [text, setText] = useState('');
  const [lines, setLines] = useState<ValidatedLine[]>([]);
  const [parsed, setParsed] = useState(false);

  const handleOpen = () => {
    setText('');
    setLines([]);
    setParsed(false);
  };

  const handleValidate = () => {
    const rawLines = text.split('\n');
    const results = rawLines.map((line, i) => parseLine(line, i, existingCourses));
    setLines(results);
    setParsed(true);
  };

  const handleImport = () => {
    const batchGroupId = Date.now().toString();
    const allCourses: (Omit<Course, 'id' | 'color' | 'createdAt' | 'groupId'> & { groupId?: string })[] = [];

    lines.forEach((line) => {
      const validSlots = line.slots.filter((s) => s.valid);
      if (validSlots.length === 0) return;

      const groupId = validSlots.length > 1
        ? (batchGroupId + line.lineIndex).toString()
        : undefined;

      validSlots.forEach((s) => {
        allCourses.push({
          ...s.course,
          groupId,
        });
      });
    });

    if (allCourses.length > 0) {
      onImport(allCourses);
      setText('');
      setLines([]);
      setParsed(false);
      onClose();
    }
  };

  const totalValid = lines.reduce((sum, l) => sum + l.slots.filter((s) => s.valid).length, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={handleOpen}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>批量导入课程</Text>
          <Text style={styles.hint}>
            每行一门：名称,教师,教室,星期,起始节,持续节,起始周,结束周
          </Text>
          <Text style={styles.hintSub}>
            双时段追加：,星期2,起始节2,持续节2（共11个字段）
          </Text>

          <TextInput
            style={styles.textArea}
            placeholder={PLACEHOLDER}
            placeholderTextColor="#B2BEC3"
            value={text}
            onChangeText={(t) => {
              setText(t);
              setParsed(false);
            }}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoFocus
          />

          <TouchableOpacity style={styles.validateBtn} onPress={handleValidate}>
            <Text style={styles.validateText}>验证</Text>
          </TouchableOpacity>

          {parsed && (
            <ScrollView style={styles.preview} showsVerticalScrollIndicator={false}>
              {lines.map((line, li) =>
                line.slots.length === 0 ? null : (
                  <View key={li} style={styles.lineGroup}>
                    {line.slots.length > 1 && (
                      <Text style={styles.groupLabel}>
                        {line.slots[0].course.name}
                      </Text>
                    )}
                    {line.slots.map((slot, si) => (
                      <View
                        key={si}
                        style={[
                          styles.previewItem,
                          slot.valid ? styles.previewValid : styles.previewInvalid,
                        ]}
                      >
                        <Text style={styles.previewIcon}>
                          {slot.valid ? '✓' : '✕'}
                        </Text>
                        <View style={styles.previewContent}>
                          <Text style={styles.previewName}>
                            {line.slots.length > 1 ? `时段${si + 1}` : (slot.course.name || '(无名称)')}
                          </Text>
                          {slot.valid ? (
                            <Text style={styles.previewDetail}>
                              周{slot.course.dayOfWeek} · 第{slot.course.startPeriod}节 ·{' '}
                              {slot.course.duration}节 · 第{slot.course.startWeek}-{slot.course.endWeek}周
                            </Text>
                          ) : (
                            <Text style={styles.previewError}>{slot.error}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )
              )}
            </ScrollView>
          )}

          {totalValid > 0 && (
            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
              <Text style={styles.importText}>导入 {totalValid} 个时段</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 4,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    color: '#B2BEC3',
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 15,
  },
  hintSub: {
    fontSize: 10,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#2D3436',
    minHeight: 140,
    marginBottom: 10,
  },
  validateBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  validateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  preview: {
    maxHeight: 180,
    marginBottom: 8,
  },
  lineGroup: {
    marginBottom: 6,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 2,
    paddingLeft: 4,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 3,
    gap: 8,
  },
  previewValid: {
    backgroundColor: '#F0FFF4',
  },
  previewInvalid: {
    backgroundColor: '#FFF5F5',
  },
  previewIcon: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3436',
  },
  previewDetail: {
    fontSize: 11,
    color: '#636E72',
    marginTop: 2,
  },
  previewError: {
    fontSize: 11,
    color: '#FF4757',
    marginTop: 2,
  },
  importBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  importText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: '#B2BEC3',
    fontWeight: '600',
  },
});
