import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOTAL_WEEKS } from './timetable';

const SEMESTER_START_KEY = '@semester_start';

const DEFAULT_START = new Date(2026, 2, 2); // 2026-03-02 Monday, week 1

function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSemesterStart(): Promise<Date> {
  try {
    const val = await AsyncStorage.getItem(SEMESTER_START_KEY);
    if (val) return new Date(JSON.parse(val));
  } catch {}
  return DEFAULT_START;
}

export async function setSemesterStart(date: Date): Promise<void> {
  await AsyncStorage.setItem(SEMESTER_START_KEY, JSON.stringify(date.toISOString()));
}

export async function getCurrentWeek(): Promise<{
  week: number;
  overflow: boolean;
}> {
  const start = await getSemesterStart();
  const today = new Date();
  const diffDays = (today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  const week = Math.floor(diffDays / 7) + 1;

  if (week < 1) return { week: 1, overflow: false };
  if (week > TOTAL_WEEKS) return { week: TOTAL_WEEKS, overflow: true };
  return { week, overflow: false };
}

export async function resetSemesterToNow(): Promise<void> {
  await setSemesterStart(mondayOfWeek(new Date()));
}
