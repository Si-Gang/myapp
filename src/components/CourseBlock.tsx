import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Course } from '../types';

interface Props {
  course: Course;
  top: number;
  left: number;
  width: number;
  height: number;
  onPress: (course: Course) => void;
}

export default function CourseBlock({ course, top, left, width, height, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.block,
        { top, left, width, height, backgroundColor: course.color },
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(course)}
    >
      <Text style={styles.name} numberOfLines={2}>
        {course.name}
      </Text>
      <Text style={styles.teacher} numberOfLines={1}>
        {course.teacher}
      </Text>
      <Text style={styles.classroom} numberOfLines={1}>
        {course.classroom}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
  teacher: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  classroom: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
});
