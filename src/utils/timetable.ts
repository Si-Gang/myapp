import { Course } from '../types';

export const ROW_HEIGHT = 56;
export const TIME_COLUMN_WIDTH = 52;
export const TOTAL_WEEKS = 16;

export interface PeriodInfo {
  period: number;
  start: string;
  end: string;
  bigSection: number;
}

export const PERIODS: PeriodInfo[] = [
  { period: 1, start: '08:00', end: '08:45', bigSection: 1 },
  { period: 2, start: '08:50', end: '09:35', bigSection: 1 },
  { period: 3, start: '09:55', end: '10:40', bigSection: 2 },
  { period: 4, start: '10:45', end: '11:30', bigSection: 2 },
  { period: 5, start: '11:35', end: '12:20', bigSection: 2 },
  { period: 6, start: '13:20', end: '14:05', bigSection: 3 },
  { period: 7, start: '14:10', end: '14:55', bigSection: 3 },
  { period: 8, start: '15:15', end: '16:00', bigSection: 4 },
  { period: 9, start: '16:05', end: '16:50', bigSection: 4 },
  { period: 10, start: '16:55', end: '17:40', bigSection: 4 },
  { period: 11, start: '18:30', end: '19:15', bigSection: 5 },
  { period: 12, start: '19:20', end: '20:05', bigSection: 5 },
  { period: 13, start: '20:10', end: '20:55', bigSection: 5 },
];

export const VALID_STARTS: Record<2 | 3, number[]> = {
  2: [1, 3, 6, 8, 11],
  3: [3, 8, 11],
};

export const BIG_SECTION_LABELS: Record<number, string> = {
  1: '第一大节 8:00-9:35',
  2: '第二大节 9:55-12:20',
  3: '第三大节 13:20-14:55',
  4: '第四大节 15:15-17:40',
  5: '第五大节 18:30-20:55',
};

// The row index (0-based) where each big section ends.
// Section 1 ends after row 1 (period 2), section 2 after row 4 (period 5), etc.
export const BIG_SECTION_END_ROWS = [1, 4, 6, 9, 12];

export function getPeriodByIndex(index: number): PeriodInfo {
  return PERIODS[index];
}

export function isValidStart(startPeriod: number, duration: 2 | 3): boolean {
  return VALID_STARTS[duration].includes(startPeriod);
}

export function getPeriodRange(startPeriod: number, duration: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < duration; i++) {
    result.push(startPeriod + i);
  }
  return result;
}

export function hasWeekOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function hasOverlap(
  dayOfWeek: number,
  startPeriod: number,
  duration: number,
  startWeek: number,
  endWeek: number,
  existingCourses: Course[],
  excludeIds?: string[]
): boolean {
  const excludeSet = new Set(excludeIds ?? []);
  const newRange = getPeriodRange(startPeriod, duration);
  return existingCourses
    .filter((c) => c.dayOfWeek === dayOfWeek && !excludeSet.has(c.id))
    .some((c) => {
      if (!hasWeekOverlap(startWeek, endWeek, c.startWeek, c.endWeek)) {
        return false;
      }
      const existRange = getPeriodRange(c.startPeriod, c.duration);
      return newRange.some((p) => existRange.includes(p));
    });
}

export function getOverlappingCourse(
  dayOfWeek: number,
  startPeriod: number,
  duration: number,
  startWeek: number,
  endWeek: number,
  existingCourses: Course[],
  excludeIds?: string[]
): Course | undefined {
  const excludeSet = new Set(excludeIds ?? []);
  const newRange = getPeriodRange(startPeriod, duration);
  return existingCourses
    .filter((c) => c.dayOfWeek === dayOfWeek && !excludeSet.has(c.id))
    .find((c) => {
      if (!hasWeekOverlap(startWeek, endWeek, c.startWeek, c.endWeek)) {
        return false;
      }
      const existRange = getPeriodRange(c.startPeriod, c.duration);
      return newRange.some((p) => existRange.includes(p));
    });
}

const PALETTE = [
  '#6C5CE7',
  '#00B894',
  '#0984E3',
  '#E17055',
  '#A29BFE',
  '#55EFC4',
  '#FAB1A0',
  '#74B9FF',
  '#FDCB6E',
  '#636E72',
];

export function assignColor(name: string): string {
  let hash = 0;
  const key = name.toLowerCase();
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
