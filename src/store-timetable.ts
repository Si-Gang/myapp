import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from './types';

const STORAGE_KEY = '@timetable_courses';

export async function loadCourses(): Promise<Course[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch {}
  return [];
}

export async function saveCourses(courses: Course[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {}
}
