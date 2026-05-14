import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Course } from '../types';
import {
  PERIODS,
  BIG_SECTION_END_ROWS,
  BIG_SECTION_LABELS,
  ROW_HEIGHT,
  TIME_COLUMN_WIDTH,
} from '../utils/timetable';
import CourseBlock from './CourseBlock';

interface Props {
  courses: Course[];
  selectedWeek: number;
  onCoursePress: (course: Course) => void;
}

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五'];

export default function TimetableGrid({ courses, selectedWeek, onCoursePress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const visibleCourses = courses.filter(
    (c) => c.startWeek <= selectedWeek && c.endWeek >= selectedWeek
  );
  const colWidth = (screenWidth - TIME_COLUMN_WIDTH) / 5;
  const gridHeight = 13 * ROW_HEIGHT;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Day header row */}
      <View style={styles.headerRow}>
        <View style={styles.cornerCell} />
        {DAY_LABELS.map((d) => (
          <View key={d} style={[styles.dayCell, { width: colWidth }]}>
            <Text style={styles.dayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid body */}
      <View style={[styles.gridBody, { height: gridHeight }]}>
        {/* Grid rows with time labels */}
        {PERIODS.map((p, i) => (
          <View key={p.period} style={[styles.row, { height: ROW_HEIGHT }]}>
            <View style={styles.timeCell}>
              <Text style={styles.periodNum}>{p.period}</Text>
              <Text style={styles.periodTime}>
                {p.start}-{p.end}
              </Text>
            </View>
            {[1, 2, 3, 4, 5].map((day) => (
              <View
                key={day}
                style={[styles.cell, { width: colWidth }]}
              />
            ))}
          </View>
        ))}

        {/* Section dividers — thin line across day columns only */}
        {BIG_SECTION_END_ROWS.slice(0, -1).map((endRow) => {
          const top = (endRow + 1) * ROW_HEIGHT;
          const period = PERIODS[endRow];
          const sectionLabel = BIG_SECTION_LABELS[period.bigSection + 1];
          return (
            <View key={endRow} style={[styles.sectionDivider, { top }]}>
              <View style={styles.sectionLabelBox}>
                <Text style={styles.sectionLabelText} numberOfLines={1}>
                  {sectionLabel}
                </Text>
              </View>
              <View style={styles.sectionLine} />
            </View>
          );
        })}

        {/* Course blocks */}
        {visibleCourses.map((course) => {
          const top = (course.startPeriod - 1) * ROW_HEIGHT;
          const left = TIME_COLUMN_WIDTH + (course.dayOfWeek - 1) * colWidth;
          const height = course.duration * ROW_HEIGHT - 2;
          const width = colWidth - 4;
          return (
            <CourseBlock
              key={course.id}
              course={course}
              top={top}
              left={left + 2}
              width={width}
              height={height}
              onPress={onCoursePress}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
  },
  cornerCell: {
    width: TIME_COLUMN_WIDTH,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  gridBody: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  timeCell: {
    width: TIME_COLUMN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFD1BA',
    backgroundColor: '#FFF8F5',
  },
  periodNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
  },
  periodTime: {
    fontSize: 9,
    color: '#B2BEC3',
    marginTop: 1,
  },
  cell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E8E8',
  },
  sectionDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ translateY: -9 }],
  },
  sectionLabelBox: {
    width: TIME_COLUMN_WIDTH,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabelText: {
    fontSize: 8,
    color: '#FF6B35',
    fontWeight: '500',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFD1BA',
  },
});
